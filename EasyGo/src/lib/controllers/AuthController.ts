'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { InvalidCredentialsError, WeakPasswordError } from '@/error'

import { createClient } from '@/utils/supabase/server'
import { AuthWeakPasswordError } from '@supabase/supabase-js'

export async function login(formData: FormData) {
    const supabase = await createClient()

    // type-casting here for convenience
    // in practice, you should validate your inputs
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const { data: userDetails } = await supabase
        .from('users')
        .select('login_failed_attempts')
        .eq('email', email)
        .single();
    if (userDetails && userDetails.login_failed_attempts >= 5) {
        throw new InvalidCredentialsError('Your account has been locked. Please check your email for reset password link');
    }


    const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    // invalid credentials, increment the attempts counter
    if (loginError) {
        if (userDetails) {
            await supabase.from('users')
                .update({ login_failed_attempts: userDetails.login_failed_attempts + 1 })
                .eq('email', email);

            // if 5 failed attemps, lock account and send a reset password email
            if (userDetails.login_failed_attempts >= 4)
                await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/?layout=reset-pw`
                });
        }
        throw new InvalidCredentialsError(loginError.message);
    }

    // login successfully, reset to 0
    if (userDetails) {
        await supabase.from('users')
        .update({ login_failed_attempts: 0 })
        .eq('email', email);
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
    console.error(error.message);
    if (error instanceof AuthWeakPasswordError && error.name === 'AuthWeakPasswordError')
        throw new WeakPasswordError(error.reasons);
    redirect('/?layout=login')
  }


  const { error: profileError } = await supabase
  .from('users')
  .insert({
    id: data.user?.id,
    name: name,
    email: email,
    login_failed_attempts: 0
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
    if (!user)
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
        if (error instanceof AuthWeakPasswordError && error.name === 'AuthWeakPasswordError')
            throw new WeakPasswordError(error.reasons);
		console.error(error);
		throw new Error('Unsuccessful password update');
	}
}

export async function resetPassword(newPw: string, code: string) {
    const supabase = await createClient();
    const {error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError)
        throw new InvalidCredentialsError('Invalid or expired token'); 

    const { error } = await supabase.auth.updateUser({
        password: newPw
    });
    if (error) {
        if (error instanceof AuthWeakPasswordError && error.name === 'AuthWeakPasswordError')
            throw new WeakPasswordError(error.reasons);
        throw new InvalidCredentialsError('Password not reset successfully');
    }

    // reset login failed attempts to 0
    await supabase
        .from('users')
        .update({ login_failed_attempts: 0 })
        .eq('id', (await supabase.auth.getUser()).data.user!.id);
    redirect('/?layout=login');
}