const showError = (text) => {
	document.getElementById('state').innerHTML = `
	<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130.2 130.2">
		<circle class="path circle" fill="none" stroke="#D06079" stroke-width="6" stroke-miterlimit="10"
			cx="65.1" cy="65.1" r="62.1" />
		<line class="path line" fill="none" stroke="#D06079" stroke-width="6" stroke-linecap="round"
			stroke-miterlimit="10" x1="34.4" y1="37.9" x2="95.8" y2="92.3" />
		<line class="path line" fill="none" stroke="#D06079" stroke-width="6" stroke-linecap="round"
			stroke-miterlimit="10" x1="95.8" y1="38" x2="34.4" y2="92.2" />
	</svg>
	<p class="error">${text} Ya puedes cerrar esta ventana.</p>
	`;
};

const showSuccess = (text) => {
	document.getElementById('state').innerHTML = `
	<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130.2 130.2">
		<circle class="path circle" fill="none" stroke="#73AF55" stroke-width="6" stroke-miterlimit="10"
			cx="65.1" cy="65.1" r="62.1" />
		<polyline class="path check" fill="none" stroke="#73AF55" stroke-width="6" stroke-linecap="round"
			stroke-miterlimit="10" points="100.2,40.2 51.5,88.8 29.8,67.5 " />
	</svg>
	<p class="success">${text} Ya puedes cerrar esta ventana.</p>
	`;
};

const getStateMessage = (code) => {
	const codes = {
		ACCOUNT_BANNED_FROM_GUILD:
			'Tu cuenta está vetada del servidor. No se pueden verificar cuentas vetadas.',
		ALT_ACCOUNTS_ARE_FORBIDDEN:
			'Las cuentas alternativas no están permitidas en el servidor. Se te ha prohibido el acceso.',
		CANNOT_BAN_MEMBER: 'No se ha podido vetar la cuenta alternativa.',
		CANNOT_SEND_REQUEST_TO_BOT:
			'No se han podido enviar solicitudes al bot. Inténtelo de nuevo más tarde.',
		CANNOT_VERIFY_MEMBER:
			'No se ha podido verificar la cuenta. Inténtalo más tarde.',
		GUILD_UNAVAILABLE:
			'El servidor no está disponible en este momento. Inténtalo más tarde.',
		MEMBER_ALREADY_VERIFIED:
			'Tu cuenta ya se encuentra verificada en este servidor.',
		MEMBER_NOT_IN_GUILD:
			'No te encuentras en el servidor. Únete para poder verificarte.',
		SESSION_EXPIRED_OR_INVALID:
			'La sesión ha expirado o es invalida. Crea un nuevo enlace con /verify.',
		VERIFIED_SUCCESSFULLY:
			'¡Cuenta verificada correctamente! Te damos la bienvenida al servidor.'
	};

	return codes[code] ?? 'No se ha podido verificar. Motivo desconocido.';
};

setTimeout(() => {
	fetch(`/api/state/${window.location.pathname.split('/').pop()}`)
		.then((response) => response.json())
		.then((data) => {
			if (data.success) {
				showSuccess(getStateMessage(data.code));
			} else {
				showError(getStateMessage(data.code));
			}
		})
		.catch(() => {
			showError('Error interno de la API.');
		});
}, 1200);
