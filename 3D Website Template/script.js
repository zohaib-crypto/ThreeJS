document.addEventListener('DOMContentLoaded', function() {
    const findOutMoreButtons = document.querySelectorAll('.find-out-more');
    const productModal = new bootstrap.Modal(document.getElementById('productModal'));
    const productModalBody = document.getElementById('productModalBody');

    findOutMoreButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            const product = this.getAttribute('data-product');
            load3DModel(product);
            productModal.show();
        });
    });

    function load3DModel(product) {
        // Replace with your 3D model loading logic (e.g., using Three.js or similar)
        productModalBody.innerHTML = `<p>Loading 3D model for ${product}...</p>`;

        // Example: If you have pre-rendered images or videos, you can load them here
        if (product === 'coca-cola') {
            productModalBody.innerHTML = '<img src="images/coca-cola-3d.gif" class="img-fluid" alt="Coca-Cola 3D">';
        } else if (product === 'sprite') {
            productModalBody.innerHTML = '<img src="images/sprite-3d.gif" class="img-fluid" alt="Sprite 3D">';
        } else if (product === 'dr-pepper') {
            productModalBody.innerHTML = '<img src="images/dr-pepper-3d.gif" class="img-fluid" alt="Dr Pepper 3D">';
        }
    }
});