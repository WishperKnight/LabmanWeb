export const ui = {
    form: document.getElementById('login-form'),
    btn: document.getElementById('btn-login'),
    alert: document.getElementById('error-alert'),
    errorMsg: document.getElementById('error-msg'),
    passInput: document.getElementById('password'),
    eyeIcon: document.getElementById('eye-icon'),

    setLoading: (isLoading) => {
        ui.btn.disabled = isLoading;
        ui.btn.innerHTML = isLoading ? 
            '<span class="spinner-border spinner-border-sm me-2"></span>Validando...' : 
            'ENTRAR AL SISTEMA';
    },

    mostrarError: (mensaje) => {
        ui.errorMsg.innerText = mensaje;
        ui.alert.classList.remove('d-none');
    },

    togglePassword: () => {
        const isPass = ui.passInput.type === 'password';
        ui.passInput.type = isPass ? 'text' : 'password';
        ui.eyeIcon.classList.toggle('fa-eye');
        ui.eyeIcon.classList.toggle('fa-eye-slash');
        ui.passInput.focus();
    }
};