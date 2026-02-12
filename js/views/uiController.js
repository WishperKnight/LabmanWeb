export const mostrarMensaje = (texto, tipo) => {
    const alert = document.getElementById('status-container');
    alert.className = `alert alert-${tipo}`;
    alert.innerText = texto;
    alert.classList.remove('d-none');
};

export const alternarPassword = (input, icon) => {
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    icon.className = isPass ? 'fas fa-eye-slash' : 'fas fa-eye';
};