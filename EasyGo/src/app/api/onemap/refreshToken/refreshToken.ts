const url = "https://www.onemap.gov.sg//api/auth/post/getToken";
    const data = JSON.stringify({
      email: process.env.ONEMAP_EMAIL,
      password: process.env.ONEMAP_EMAIL_PASSWORD
    });
    
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data,
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json(); 
      })
      .then(data => {
        console.log(data);  
      })
      .catch(error => {
        console.error('Error:', error);
      });
      