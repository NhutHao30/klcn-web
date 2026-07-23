import fs from 'fs';
import path from 'path';

const htmlDir = 'D:/IT/Font-End/HTML_CSS/DoLa_Bakery/Pages';
const reactDir = 'D:/IT/HocKy_6/LapTrinhJAVA/DoAnKetThucMon/DolaBakery_FontEnd/src/Pages';

const filesToConvert = [
    { html: 'Cart.html', jsx: 'CartPage.jsx', name: 'CartPage' },
    { html: 'Cau-hoi-thuong-gap.html', jsx: 'FAQPage.jsx', name: 'FAQPage' },
    { html: 'Gioi-thieu.html', jsx: 'AboutPage.jsx', name: 'AboutPage' },
    { html: 'Lien-he.html', jsx: 'ContactPage.jsx', name: 'ContactPage' },
    { html: 'Login.html', jsx: 'LoginPage.jsx', name: 'LoginPage' },
    { html: 'register.html', jsx: 'RegisterPage.jsx', name: 'RegisterPage' },
    { html: 'Yeu-Thich.html', jsx: 'WishlistPage.jsx', name: 'WishlistPage' }
];

function convertHtmlToJsx(htmlContent) {
    let content = htmlContent.match(/<content>([\s\S]*?)<\/content>/i);
    let html = content ? content[1] : htmlContent;
    
    // Replace class= with className=
    html = html.replace(/class=/g, 'className=');
    // Replace for= with htmlFor=
    html = html.replace(/for=/g, 'htmlFor=');
    // Close input, img, br, hr tags
    html = html.replace(/<(input|img|br|hr)([^>]*?)(?!\/|><)>/g, '<$1$2 />');
    html = html.replace(/<!--[\s\S]*?-->/g, ''); // remove comments
    // Convert style="..." to style={{...}}
    html = html.replace(/style="([^"]*)"/g, (match, styleString) => {
        let styleObj = styleString.split(';').reduce((acc, curr) => {
            let [key, value] = curr.split(':');
            if (key && value) {
                key = key.trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                acc.push(`${key}: "${value.trim()}"`);
            }
            return acc;
        }, []).join(', ');
        return `style={{ ${styleObj} }}`;
    });
    
    // Fix src="../Assets/IMG/..." to "../../assets/IMG/..."
    html = html.replace(/src="\.\.\/Assets\/IMG\//g, 'src="../../assets/IMG/');

    return html;
}

filesToConvert.forEach(file => {
    try {
        const htmlContent = fs.readFileSync(path.join(htmlDir, file.html), 'utf8');
        const jsxContent = `import React from "react";
import Footer from "../Layout/Footer";

const ${file.name} = () => {
    return (
        <>
            <main>
                ${convertHtmlToJsx(htmlContent)}
            </main>
            <Footer />
        </>
    );
};

export default ${file.name};
`;
        fs.writeFileSync(path.join(reactDir, file.jsx), jsxContent);
        console.log(`Converted ${file.html} to ${file.jsx}`);
    } catch (e) {
        console.error(`Failed to convert ${file.html}:`, e.message);
    }
});

// Also extract Modal
try {
    const homeHtml = fs.readFileSync(path.join(htmlDir, 'Trang-Chu.html'), 'utf8');
    const modalMatch = homeHtml.match(/<modal>([\s\S]*?)<\/modal>/i);
    if (modalMatch) {
        let modalHtml = convertHtmlToJsx(modalMatch[1]);
        // some custom fixes for onclick in modal
        modalHtml = modalHtml.replace(/onclick="([^"]*)"/g, 'onClick={() => {}}');
        const modalJsxContent = `import React from "react";

const Modal = () => {
    return (
        <>
            ${modalHtml}
        </>
    );
};

export default Modal;
`;
        fs.writeFileSync('D:/IT/HocKy_6/LapTrinhJAVA/DoAnKetThucMon/DolaBakery_FontEnd/src/components/Modal.jsx', modalJsxContent);
        console.log("Converted Modal");
    }
} catch (e) {
    console.error("Failed to convert Modal", e.message);
}
