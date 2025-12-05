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
                populateCountryCodes();
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
        if (isIndexPage) {
            renderIndexPage();
        } else if (isSelectedPage) {
            renderSelectedPage();
        }
    }

    function renderProductCard(product) {
        const isSelected = state.selectedProducts[product.id];
        const quantity = isSelected ? isSelected.quantity : 1;
        return `
            <div class="product-card" data-id="${product.id}">
                <img src="${product.imgsrc}" alt="${product.producto}" class="product-image">
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
        return `
            <div class="product-card" data-id="${product.id}">
                <img src="${product.imgsrc}" alt="${product.producto}" class="product-image">
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
        brandFilter.innerHTML = '<option value="">TODAS LAS MARCAS</option>';
        const brands = [...new Set(state.products.map(p => p.marca))];
        brands.sort().forEach(brand => {
            const option = document.createElement('option');
            option.value = brand;
            option.textContent = brand;
            brandFilter.appendChild(option);
        });
    }

    function populateCountryCodes() {
        const countryCodeSelect = document.getElementById('country-code');
        const countries = [
            { code: '+595', name: 'Paraguay', flag: '🇵🇾' },
            { code: '+54', name: 'Argentina', flag: '🇦🇷' },
            { code: '+55', name: 'Brasil', flag: '🇧🇷' },
        ];
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.code;
            option.textContent = `${country.flag} ${country.name} (${country.code})`;
            countryCodeSelect.appendChild(option);
        });
        countryCodeSelect.value = '+595';
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
                renderSelectedPage(); // Re-render to show the item is gone
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
                    // If quantity is 0 or less, treat it as a deletion
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
        document.getElementById('download-pdf').addEventListener('click', downloadPDF);
        document.getElementById('send-whatsapp').addEventListener('click', sendWhatsApp);
    }

    document.getElementById('clear-selection').addEventListener('click', clearSelection);

    function validateInputs() {
        const name = document.getElementById('name').value;
        const whatsapp = document.getElementById('whatsapp').value;
        const email = document.getElementById('email').value;
        if (!name || !whatsapp) {
            alert('Por favor, complete los campos de Nombre y Apellido y WhatsApp.');
            return false;
        }
        if (email && !/^\S+@\S+\.\S+$/.test(email)) {
            alert('Por favor, ingrese un correo electrónico válido.');
            return false;
        }
        return true;
    }

    async function downloadPDF() {
        if (!validateInputs()) return;
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.text("Productos Seleccionados", 20, 20);
        let y = 30;

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const countryCode = document.getElementById('country-code').value;
        let whatsapp = document.getElementById('whatsapp').value;
        if (whatsapp.startsWith('0')) {
            whatsapp = whatsapp.substring(1);
        }
        const businessName = document.getElementById('business-name').value;

        doc.text(`Nombre y Apellido: ${name}`, 20, y); y += 10;
        doc.text(`Correo: ${email}`, 20, y); y += 10;
        doc.text(`WhatsApp: ${countryCode}${whatsapp}`, 20, y); y += 10;
        doc.text(`Nombre del Negocio: ${businessName}`, 20, y); y += 10;
        y += 10;

        const selectedIds = Object.keys(state.selectedProducts);
        const selectedProductObjects = state.products.filter(p => selectedIds.includes(p.id.toString()));

        for (const product of selectedProductObjects) {
             if (y > 250) {
                doc.addPage();
                y = 20;
            }
            doc.text(`- ${product.producto} (Cantidad: ${state.selectedProducts[product.id].quantity})`, 20, y);
            y += 10;
        }
        doc.save('seleccion-productos.pdf');
    }

    function sendWhatsApp() {
        if (!validateInputs()) return;

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const countryCode = document.getElementById('country-code').value;
        let whatsapp = document.getElementById('whatsapp').value;
        if (whatsapp.startsWith('0')) {
            whatsapp = whatsapp.substring(1);
        }
        const businessName = document.getElementById('business-name').value;

        const selectedIds = Object.keys(state.selectedProducts);
        if (selectedIds.length === 0) {
            alert("No hay productos seleccionados para enviar.");
            return;
        }

        const productNames = state.products
            .filter(p => selectedIds.includes(p.id.toString()))
            .map(p => `${p.producto} (Cantidad: ${state.selectedProducts[p.id].quantity})`)
            .join('\n');

        let message = `Hola, mi nombre es ${name}.\n`;
        if (email) message += `Mi correo es ${email}.\n`;
        if (businessName) message += `Mi negocio es ${businessName}.\n`;
        message += `Estoy interesado en los siguientes productos:\n\n${productNames}`;

        const phoneNumber = "+595987334125";
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, '_blank');
    }

    initialize();
});
