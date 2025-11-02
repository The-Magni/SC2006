'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    console.error(error)
    redirect('/?layout=login')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const name = formData.get('name') as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    console.error(error)
    redirect('/?layout=login')
  }


  const { error: profileError } = await supabase
  .from('users')
  .insert({
    id: data.user?.id,
    name: name
  });

  if (profileError) {
    console.error(error);
  }

  revalidatePath('/', 'layout')
  redirect('/?layout=login')
}

export async function logout() {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) {
        console.error(error);
        const { data: { session } } = await supabase.auth.getSession();
        if (session) 
            return { success: false, message: 'Logout failed' };
        redirect('/?layout=login');
    }
    redirect('/?layout=login');
}


export async function updatePersonal(formData: FormData) {
    const supabase = await createClient();
	const name = formData.get('name') as string;
	const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email)
        throw new Error('Unauthorized');
	const { data, error } = await supabase
	.from('users')
	.update({name: name})
	.eq('id', user.id);
	if (error)
		console.error(error);
}


export async function updatePassword(current: string, newPass: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email)
        throw new Error('Unauthorized');
	const { data, error: checkPwError } = await supabase.auth.signInWithPassword({
		email: user.email,
		password: current,
	});
	if (checkPwError)
		throw new Error('Wrong current password');

    const { error } = await supabase.auth.updateUser({
		password: newPass
	});
	if (error) {
		console.error(error);
		throw new Error('Unsuccessful password update');
	}
}