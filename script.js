document.addEventListener('DOMContentLoaded', () => {
    const csvData = `PRODUCTO,MARCA,MODELO,IMGSRC
ANA HICKMANN AH MARI-7 D21,ANA HICKMANN,AH MARI-7 D21,https://loja.oticaademar.com.br/image/cache/catalog/Produtos/59475%20-%20Armacao%20Ana%20Hickmann%20MARI%207%20D21%2054-16%2001-800x800.jpg
ANA HICKMANN AH MARI-7 N01,ANA HICKMANN,AH MARI-7 N01,https://loja.oticaademar.com.br/image/cache/catalog/Produtos/59476%20-%20Armacao%20Ana%20Hickmann%20MARI%207%20N01%2054-16%2001-800x800.jpg
ANA HICKMANN AH NINA-3 N01,ANA HICKMANN,AH NINA-3 N01,https://loja.oticaademar.com.br/image/cache/catalog/Produtos/59481%20-%20Armacao%20Ana%20Hickmann%20NINA%203%20N01%2054-17%2001-800x800.jpg
ANA HICKMANN AH NINA-4 N01,ANA HICKMANN,AH NINA-4 N01,https://loja.oticaademar.com.br/image/cache/catalog/Produtos/60706%20-%20Armacao%20Ana%20Hickmann%20NINA%204%20C02%2053-16%2001-350x350.jpg
ANA HICKMANN AH RAFA-1 01A,ANA HICKMANN,AH RAFA-1 01A,https://anahickmanneyewear.com.br/wp-content/uploads/2025/04/RAFA-1-01A.png
ATITUDE AT1701-04A,ATITUDE,AT1701-04A,https://images.tcdn.com.br/img/img_prod/846719/armacao_para_oculos_de_grau_atitude_at1700_04a_4117_1_70c6e14a7ed4266744a70bcd7fb5b133.jpg
BULGET BG1691M-02A,BULGET,BG1691M-02A,https://www.safira.com.br/cdn/imagens/produtos/det/oculos-de-grau-bulget-bg1691m-02a-14cd071976a90210885e9c53cc9a418a.jpg
HICKMANN HI ACACIA 5 K02,HICKMANN,HI ACACIA 5 K02,https://loja.oticaademar.com.br/image/cache/catalog/Produtos/58815%20-%20Armacao%20Hickmann%20ACACIA%205%20K02%2053-17%2001-800x800.jpg
`;

    const state = {
        products: [],
        filteredProducts: [],
        selectedProducts: JSON.parse(localStorage.getItem('selectedProducts')) || {},
        currentPage: 1,
        itemsPerPage: 30,
    };

    const isIndexPage = document.getElementById('product-container');
    const isSelectedPage = document.getElementById('selected-product-container');

    function initialize() {
        state.products = parseCSV(csvData);
        state.filteredProducts = state.products;
        if (isIndexPage) {
            populateBrandFilter();
            renderIndexPage();
        } else if (isSelectedPage) {
            populateCountryCodes();
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
        }).filter(p => p.producto);
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

    function populateBrandFilter() {
        const brandFilter = document.getElementById('brand-filter');
        const brands = [...new Set(state.products.map(p => p.marca))];
        brands.forEach(brand => {
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
        if (selectedBrand) {
            state.filteredProducts = state.products.filter(p => p.marca === selectedBrand);
        } else {
            state.filteredProducts = state.products;
        }
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
