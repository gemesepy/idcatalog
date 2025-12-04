document.addEventListener('DOMContentLoaded', () => {
    const state = {
        products: [],
        filteredProducts: [],
        selectedProducts: JSON.parse(localStorage.getItem('selectedProducts')) || {},
        currentPage: 1,
        itemsPerPage: 30,
    };

    const isIndexPage = document.getElementById('product-container');
    const isSelectedPage = document.getElementById('selected-product-container');

    // Fetch and parse data
    async function loadProducts() {
        const response = await fetch('idcatalog.csv');
        const data = await response.text();
        state.products = parseCSV(data);
        state.filteredProducts = state.products;
        if (isIndexPage) {
            renderIndexPage();
        } else if (isSelectedPage) {
            renderSelectedPage();
        }
    }

    function parseCSV(data) {
        const rows = data.split('\n').slice(1);
        return rows.map((row, i) => {
            const columns = row.split(',');
            return {
                id: i,
                producto: columns[0],
                marca: columns[1],
                modelo: columns[2],
                imgsrc: columns[3],
            };
        }).filter(p => p.producto); // Filter out empty rows
    }

    // --- State Management ---
    function saveSelection() {
        localStorage.setItem('selectedProducts', JSON.stringify(state.selectedProducts));
    }

    function clearSelection() {
        state.selectedProducts = {};
        saveSelection();
        if (isIndexPage) {
            renderIndexPage();
        } else if (isSelectedPage) {
            renderSelectedPage();
        }
    }

    // --- Rendering ---
    function renderProductCard(product) {
        const isSelected = state.selectedProducts[product.id];
        const quantity = isSelected ? isSelected.quantity : 1;

        return `
            <div class="product-card" data-id="${product.id}">
                <img src="${product.imgsrc}" alt="${product.producto}" class="product-image">
                <h3>${product.producto}</h3>
                <p><strong>Marca:</strong> ${product.marca}</p>
                <p><strong>Modelo:</strong> ${product.modelo}</p>
                <div class="selection">
                    <input type="checkbox" class="select-checkbox" ${isSelected ? 'checked' : ''}>
                    <label>Seleccionar</label>
                </div>
                <div class="quantity">
                    <label>Cantidad:</label>
                    <input type="number" class="quantity-input" value="${quantity}" min="1" ${!isSelected ? 'disabled' : ''}>
                </div>
            </div>
        `;
    }
    
    function renderSelectedProductCard(product) {
        const selection = state.selectedProducts[product.id];
        if (!selection) return '';

        return `
            <div class="product-card" data-id="${product.id}">
                <img src="${product.imgsrc}" alt="${product.producto}" class="product-image">
                <h3>${product.producto}</h3>
                <p><strong>Marca:</strong> ${product.marca}</p>
                <p><strong>Modelo:</strong> ${product.modelo}</p>
                <p><strong>Cantidad:</strong> ${selection.quantity}</p>
            </div>
        `;
    }

    function renderIndexPage() {
        const container = document.getElementById('product-container');
        if (!container) return;
        container.innerHTML = '';

        const start = (state.currentPage - 1) * state.itemsPerPage;
        const end = state.itemsPerPage === 'all' ? state.filteredProducts.length : start + state.itemsPerPage;
        const paginatedProducts = state.filteredProducts.slice(start, end);

        paginatedProducts.forEach(product => {
            container.innerHTML += renderProductCard(product);
        });

        updatePaginationInfo();
        addIndexEventListeners();
    }

    function renderSelectedPage() {
        const container = document.getElementById('selected-product-container');
        if (!container) return;
        container.innerHTML = '';
        
        const selectedIds = Object.keys(state.selectedProducts);
        if (selectedIds.length === 0) {
            container.innerHTML = '<p>No hay productos seleccionados.</p>';
            return;
        }

        const selectedProductObjects = state.products.filter(p => selectedIds.includes(p.id.toString()));
        selectedProductObjects.forEach(product => {
            container.innerHTML += renderSelectedProductCard(product);
        });
        addSelectedPageEventListeners();
    }

    // --- Pagination and Filtering ---
    function updatePaginationInfo() {
        const pageInfo = document.getElementById('page-info');
        if (pageInfo) {
            const totalPages = state.itemsPerPage === 'all' ? 1 : Math.ceil(state.filteredProducts.length / state.itemsPerPage);
            pageInfo.textContent = `Página ${state.currentPage} de ${totalPages}`;
        }
    }
    
    function filterProducts() {
        const filterText = document.getElementById('brand-filter').value.toLowerCase();
        state.filteredProducts = state.products.filter(p => p.marca.toLowerCase().includes(filterText));
        state.currentPage = 1;
        renderIndexPage();
    }

    // --- Event Listeners ---
    function addIndexEventListeners() {
        // Product card interactions
        document.querySelectorAll('.select-checkbox').forEach(box => {
            box.addEventListener('change', (e) => {
                const card = e.target.closest('.product-card');
                const productId = card.dataset.id;
                const quantityInput = card.querySelector('.quantity-input');
                if (e.target.checked) {
                    state.selectedProducts[productId] = { quantity: parseInt(quantityInput.value) };
                    quantityInput.disabled = false;
                } else {
                    delete state.selectedProducts[productId];
                    quantityInput.disabled = true;
                }
                saveSelection();
            });
        });

        document.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const card = e.target.closest('.product-card');
                const productId = card.dataset.id;
                if (state.selectedProducts[productId]) {
                    state.selectedProducts[productId].quantity = parseInt(e.target.value);
                    saveSelection();
                }
            });
        });
        
        addImageZoomListeners();
    }
    
    function addSelectedPageEventListeners() {
        addImageZoomListeners();
    }
    
    function addImageZoomListeners() {
        const modal = document.getElementById('image-modal');
        const modalImg = document.getElementById('modal-image');
        const closeModal = document.querySelector('.close-modal');

        document.querySelectorAll('.product-image').forEach(img => {
            img.onclick = function() {
                modal.style.display = "block";
                modalImg.src = this.src;
            }
        });

        closeModal.onclick = function() {
            modal.style.display = "none";
        }
    }
    
    // --- Global Event Listeners ---
    if (isIndexPage) {
        document.getElementById('brand-filter').addEventListener('input', filterProducts);
        document.getElementById('open-selected').addEventListener('click', () => window.location.href = 'seleccionados.html');
        document.getElementById('first-page').addEventListener('click', () => { state.currentPage = 1; renderIndexPage(); });
        document.getElementById('prev-page').addEventListener('click', () => { if (state.currentPage > 1) state.currentPage--; renderIndexPage(); });
        document.getElementById('next-page').addEventListener('click', () => {
             const totalPages = Math.ceil(state.filteredProducts.length / state.itemsPerPage);
             if (state.currentPage < totalPages) state.currentPage++;
             renderIndexPage();
        });
        document.getElementById('last-page').addEventListener('click', () => {
            state.currentPage = Math.ceil(state.filteredProducts.length / state.itemsPerPage);
            renderIndexPage();
        });
        document.getElementById('items-per-page').addEventListener('change', (e) => {
            state.itemsPerPage = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
            state.currentPage = 1;
            renderIndexPage();
        });
    }
    
    if (isSelectedPage) {
        document.getElementById('download-pdf').addEventListener('click', downloadPDF);
        document.getElementById('send-whatsapp').addEventListener('click', sendWhatsApp);
    }

    document.getElementById('clear-selection').addEventListener('click', clearSelection);


    // --- Advanced Features ---
    async function downloadPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.text("Productos Seleccionados", 20, 20);
        let y = 30;

        const selectedIds = Object.keys(state.selectedProducts);
        const selectedProductObjects = state.products.filter(p => selectedIds.includes(p.id.toString()));

        for (const product of selectedProductObjects) {
             if (y > 250) { // New page
                doc.addPage();
                y = 20;
            }
            doc.text(`- ${product.producto} (Cantidad: ${state.selectedProducts[product.id].quantity})`, 20, y);
            y += 10;
        }

        doc.save('seleccion-productos.pdf');
    }

    function sendWhatsApp() {
        const selectedIds = Object.keys(state.selectedProducts);
        if (selectedIds.length === 0) {
            alert("No hay productos seleccionados para enviar.");
            return;
        }
        
        const productNames = state.products
            .filter(p => selectedIds.includes(p.id.toString()))
            .map(p => `${p.producto} (Cantidad: ${state.selectedProducts[p.id].quantity})`)
            .join('\n');
            
        const message = encodeURIComponent(`Hola, estoy interesado en los siguientes productos:\n\n${productNames}`);
        const phoneNumber = "+595987334125";
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
        
        window.open(whatsappUrl, '_blank');
    }

    // --- Initial Load ---
    loadProducts();
});
