function is_valid_input(value) {
    const regex = /^[a-zA-ZæøåÆØÅ0-9,.\-\s]+$/; // only (, - . letters and numbers)
    return regex.test(value);
}

// Send warning message to user
function warning_message(product){
    const inputs = document.querySelectorAll('#wishlist_products_id input[type="text"]');

    // Search all text boxes
    inputs.forEach(input => {
        const value = input.value.trim();
        const warningText = input.nextElementSibling;

        if (value === product) {
            input.style.borderColor = 'var(--warning-color)';
            warningText.className = 'input-warning';
            warningText.textContent = 'Produktet blev ikke fundet';
        }
    });
}

export { is_valid_input, warning_message };