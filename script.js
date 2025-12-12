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

    async function initialize() {
        try {
            const response = await fetch('idcatalog.csv');
            const csvData = await response.text();
            state.products = parseCSV(csvData);
            state.filteredProducts = state.products;
            if (isIndexPage) {
                populateBrandFilter();
                renderIndexPage();
            } else if (isSelectedPage) {
                renderSelectedPage();
            }
        } catch (error) {
            console.error("Error during initialization:", error);
            if(isIndexPage) {
                document.getElementById('product-container').innerHTML = '<p>Error al cargar los productos. Por favor, revise la consola para más detalles.</p>';
            }
        }
    }

    function parseCSV(data) {
        const rows = data.split('\n').slice(1);
        return rows.map((row, i) => {
            const columns = row.split(',');
            if (columns.length < 4) {
                console.warn(`Skipping malformed CSV row ${i + 2}: ${row}`);
                return null;
            }
            return {
                id: i,
                producto: columns[0],
                marca: columns[1],
                modelo: columns[2],
                imgsrc: columns.slice(3).join(','),
            };
        }).filter(p => p && p.producto);
    }

    function saveSelection() {
        localStorage.setItem('selectedProducts', JSON.stringify(state.selectedProducts));
    }

    function clearSelection() {
        state.selectedProducts = {};
        saveSelection();

        // Limpiar campos del formulario en seleccionados.html
        if (isSelectedPage) {
            document.getElementById('name').value = '';
            const radioButtons = document.querySelectorAll('input[name="client-type"]');
            radioButtons.forEach(radio => radio.checked = false);
            renderSelectedPage();
        } else if (isIndexPage) {
            renderIndexPage();
        }
    }

    function renderProductCard(product) {
        const isSelected = state.selectedProducts[product.id];
        const quantity = isSelected ? isSelected.quantity : 1;
        const placeholder = 'https://via.placeholder.com/300x300.png?text=No+Disponible';
        const imgSrc = product.imgsrc && product.imgsrc.trim() ? product.imgsrc.trim() : placeholder;
        return `
            <div class="product-card" data-id="${product.id}">
                <img src="${imgSrc}" alt="${product.producto}" class="product-image">
                <h3>${product.producto}</h3>
                <div class="selection">
                    <input type="checkbox" class="select-checkbox" ${isSelected ? 'checked' : ''}>
                    <label>SELECCIONAR</label>
                </div>
                <div class="quantity">
                    <label>CANTIDAD:</label>
                    <input type="number" class="quantity-input" value="${quantity}" min="1" ${!isSelected ? 'disabled' : ''}>
                </div>
            </div>
        `;
    }

    function renderSelectedProductCard(product) {
        const selection = state.selectedProducts[product.id];
        if (!selection) return '';
        const placeholder = 'https://via.placeholder.com/300x300.png?text=No+Disponible';
        const imgSrc = product.imgsrc && product.imgsrc.trim() ? product.imgsrc.trim() : placeholder;
        return `
            <div class="product-card" data-id="${product.id}">
                <img src="${imgSrc}" alt="${product.producto}" class="product-image">
                <h3>${product.producto}</h3>
                <div class="quantity">
                    <label>CANTIDAD:</label>
                    <input type="number" class="quantity-input" value="${selection.quantity}" min="1">
                </div>
                <button class="delete-btn">Eliminar</button>
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

    function populateBrandFilter() {
        const brandFilter = document.getElementById('brand-filter');
        if (!brandFilter) return;
        brandFilter.innerHTML = '<option value="">TODAS LAS MARCAS</option>';
        const brands = [...new Set(state.products.map(p => p.marca))];
        brands.sort().forEach(brand => {
            const option = document.createElement('option');
            option.value = brand;
            option.textContent = brand;
            brandFilter.appendChild(option);
        });
    }

    function updatePaginationInfo() {
        const pageInfo = document.getElementById('page-info');
        if (pageInfo) {
            const totalPages = state.itemsPerPage === 'all' ? 1 : Math.ceil(state.filteredProducts.length / state.itemsPerPage);
            pageInfo.textContent = `Página ${state.currentPage} de ${totalPages}`;
        }
    }

    function filterProducts() {
        const selectedBrand = document.getElementById('brand-filter').value;
        const nameQuery = document.getElementById('name-filter').value.toLowerCase();

        let products = state.products;

        if (selectedBrand) {
            products = products.filter(p => p.marca === selectedBrand);
        }

        if (nameQuery) {
            products = products.filter(p => p.producto.toLowerCase().includes(nameQuery));
        }

        state.filteredProducts = products;
        state.currentPage = 1;
        renderIndexPage();
    }

    function addIndexEventListeners() {
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
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const card = e.target.closest('.product-card');
                const productId = card.dataset.id;
                delete state.selectedProducts[productId];
                saveSelection();
                renderSelectedPage();
            });
        });

        document.querySelectorAll('#selected-product-container .quantity-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const card = e.target.closest('.product-card');
                const productId = card.dataset.id;
                const newQuantity = parseInt(e.target.value);
                if (newQuantity > 0) {
                    state.selectedProducts[productId].quantity = newQuantity;
                    saveSelection();
                } else {
                    delete state.selectedProducts[productId];
                    saveSelection();
                    renderSelectedPage();
                }
            });
        });
        addImageZoomListeners();
    }

    function addImageZoomListeners() {
        const modal = document.getElementById('image-modal');
        const modalImg = document.getElementById('modal-image');
        const closeModal = document.querySelector('.close-modal');
        if (modal && closeModal) {
            document.querySelectorAll('.product-image').forEach(img => {
                img.onclick = function() {
                    modal.style.display = "block";
                    modalImg.src = this.src;
                }
            });
            closeModal.onclick = function() {
                modal.style.display = "none";
            }
            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    modal.style.display = "none";
                }
            });
        }
    }

    // Event listeners
    if (isIndexPage) {
        document.getElementById('brand-filter').addEventListener('change', filterProducts);
        document.getElementById('name-filter').addEventListener('input', filterProducts);
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
        document.getElementById('back-to-catalog').addEventListener('click', () => window.location.href = 'index.html');
        document.getElementById('download-pdf').addEventListener('click', downloadPDF);
        document.getElementById('send-whatsapp').addEventListener('click', sendWhatsApp);
    }

    const clearButton = document.getElementById('clear-selection');
    if (clearButton) {
        clearButton.addEventListener('click', clearSelection);
    }

    function getHeaderText() {
        const clientName = document.getElementById('name').value.toUpperCase();
        const clientTypeRadio = document.querySelector('input[name="client-type"]:checked');
        const clientType = clientTypeRadio ? clientTypeRadio.value.toUpperCase() : '';

        return `#######
Hola ID IMPORT EXPORT.
Soy ${clientName}.
${clientType}.
-------
Estoy interesado en los siguientes productos:
-------`;
    }

    function getFooterText() {
        return `-------
#######`;
    }

    async function downloadPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const headerText = getHeaderText();
        const footerText = getFooterText();
        const productList = state.products
            .filter(p => Object.keys(state.selectedProducts).includes(p.id.toString()))
            .map(p => `- ${p.producto} (Cantidad: ${state.selectedProducts[p.id].quantity})`)
            .join('\n');

        const fullText = `${headerText}\n\n${productList}\n\n${footerText}`;

        // Add text to PDF
        const splitText = doc.splitTextToSize(fullText, 180);
        doc.text(splitText, 10, 20);

        // Add date
        const today = new Date();
        const dateString = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
        doc.text(dateString, 10, doc.internal.pageSize.height - 10);

        doc.save('seleccion-productos.pdf');
    }

    function sendWhatsApp() {
        const selectedIds = Object.keys(state.selectedProducts);
        if (selectedIds.length === 0) {
            alert("No hay productos seleccionados para enviar.");
            return;
        }

        const headerText = getHeaderText();
        const footerText = getFooterText();
        const productList = state.products
            .filter(p => selectedIds.includes(p.id.toString()))
            .map(p => `${p.producto} (Cantidad: ${state.selectedProducts[p.id].quantity})`)
            .join('\n');

        const message = `${headerText}\n\n${productList}\n\n${footerText}`;

        const phoneNumber = "+595987334125";
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, '_blank');
    }

    initialize();
});
