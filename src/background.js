import browser from "webextension-polyfill";
import { PDFDocument } from "pdf-lib";

// Constants
const PDF_CONFIG = {
	mimeType: "application/pdf",
};

// Main message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	console.log("Message received in background:", request.type);

	if (request.type === "screenshot") {
		handleScreenshot(request.data, sendResponse);
		return true; // Keep message port open for async response
	}

	return false;
});

// Handle screenshot processing
async function handleScreenshot(dataURL, sendResponse) {
	try {
    const pdfBlob = await convertToPDF(dataURL);
    console.log(pdfBlob);
		sendResponse({
			success: true,
			data: pdfBlob,
			message: "PDF generated successfully",
		});
	} catch (error) {
		console.error("PDF generation failed:", error);
		sendResponse({
			success: false,
			error: error.message,
			message: "PDF generation failed",
		});
	}
}

// Convert base64 image to PDF
async function convertToPDF(dataURL) {
	try {
		const imageBytes = base64ToUint8Array(dataURL);
		const pdfDoc = await PDFDocument.create();
		const pngImage = await pdfDoc.embedPng(imageBytes);

		const { width, height } = pngImage.size();
		const page = pdfDoc.addPage([width, height]);

		page.drawImage(pngImage, {
			x: 0,
			y: 0,
			width,
			height,
		});

		const pdfBytes = await pdfDoc.save();
		return new Blob([pdfBytes], { type: PDF_CONFIG.mimeType });
	} catch (error) {
		throw new Error(`PDF conversion failed: ${error.message}`);
	}
}

// Utility function to convert base64 to Uint8Array
function base64ToUint8Array(dataURL) {
	const base64Data = dataURL.split(",")[1];
	return Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
}

// Optional: Extension installation handler
browser.runtime.onInstalled.addListener((details) => {
	console.log("Extension installed:", details);
});
