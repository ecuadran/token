document.getElementById('tokenizeForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = (<HTMLInputElement>document.getElementById('email')).value;
    const cardNumber = (<HTMLInputElement>document.getElementById('cardNumber')).value;
    const cvv = (<HTMLInputElement>document.getElementById('cvv')).value;
    const expirationMonth = (<HTMLInputElement>document.getElementById('expirationMonth')).value;
    const expirationYear = (<HTMLInputElement>document.getElementById('expirationYear')).value;

    const response = await fetch('../../server/app.js', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'token': 'pk_test_LsRBKejzCOEEWOsw'
        },
        body: JSON.stringify({
            email,
            card_number: cardNumber,
            ccv: cvv,
            expiration_month: expirationMonth,
            expiration_year: expirationYear
        })
    });

    const data = await response.json();
    document.getElementById('result')!.innerHTML = `Token generado: ${data.token}`;
});

document.getElementById('getCardForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const token = (<HTMLInputElement>document.getElementById('getToken')).value;

    const response = await fetch(`/obtener_tarjeta?token=${token}`, {
        method: 'GET',
        headers: {
            'token': 'pk_test_LsRBKejzCOEEWOsw'
        }
    });

    if (response.status === 200) {
        const data = await response.json();
        document.getElementById('result')!.innerHTML = `Datos de Tarjeta: ${JSON.stringify(data)}`;
    } else {
        const data = await response.json();
        document.getElementById('result')!.innerHTML = `Error: ${data.message}`;
    }
});
