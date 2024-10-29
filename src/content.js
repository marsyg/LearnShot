// Constants and utility functions
import { PDFDocument } from "pdf-lib";
const SCREENSHOT_CONFIG = {
	type: "image/png",
	quality: 1.0,
};
const PDF_CONFIG = {
	mimeType: "application/pdf",
};

function initializeScreenshotButton(videoElement) {
	const button = createScreenshotButton();
	button.addEventListener("click", () => handleScreenshot(videoElement));
	document.body.appendChild(button);
}


function createScreenshotButton() {
	const button = document.createElement("button");
	button.textContent = "Take Screenshot";
	Object.assign(button.style, {
		position: "fixed",
		top: "10px",
		right: "10px",
		zIndex: "9999",
		backgroundColor: "blue",
		color: "white",
		padding: "10px",
		border: "none",
		borderRadius: "5px",
		cursor: "pointer",
	});
	return button;
}


async function handleScreenshot(videoElement) {
	try {
		const dataURL = captureVideoFrame(videoElement);
		if (dataURL) {
			await convertToPDF(dataURL);
		}
	} catch (error) {
		console.error("Screenshot failed:", error);
	}
}
//trying to convert form content 
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
		const blob = new Blob([pdfBytes], { type: PDF_CONFIG.mimeType });
		const blobUrl = URL.createObjectURL(blob);

				// Create and trigger download
				const link = document.createElement("a");
				link.href = blobUrl;
				link.download = `screenshot_${Date.now()}.pdf`;
				document.body.appendChild(link);
				link.click();

				setTimeout(() => {
					document.body.removeChild(link);
					URL.revokeObjectURL(blobUrl);
				}, 100);
	} catch (error) {
		throw new Error(`PDF conversion failed: ${error.message}`);
	}
}
// async function handleScreenshot(dataURL) {
// 	try {
// 		const pdfBlob = await convertToPDF(dataURL);
// 		console.log(pdfBlob);
// 		sendResponse({
// 			success: true,
// 			data: pdfBlob,
// 			message: "PDF generated successfully",
// 		});
// 	} catch (error) {
// 		console.error("PDF generation failed:", error);
// 		sendResponse({
// 			success: false,
// 			error: error.message,
// 			message: "PDF generation failed",
// 		});
// 	}
// }
// Utility function to convert base64 to Uint8Array
function base64ToUint8Array(dataURL) {
	const base64Data = dataURL.split(",")[1];
	return Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
}

function captureVideoFrame(videoElement) {
	const canvas = document.createElement("canvas");
	canvas.width = videoElement.videoWidth;
	canvas.height = videoElement.videoHeight;

	const context = canvas.getContext("2d");
	context.drawImage(videoElement, 0, 0);
	return canvas.toDataURL(SCREENSHOT_CONFIG.type, SCREENSHOT_CONFIG.quality);
}


// async function sendScreenshotToBackground(dataURL) {
// 	return new Promise((resolve, reject) => {
// 		chrome.runtime.sendMessage(
// 			{ type: "screenshot", data: dataURL },
// 			(response) => {
// 				if (chrome.runtime.lastError) {
// 					reject(new Error(chrome.runtime.lastError.message));
// 					return;
// 				}
//         console.log("Screenshot processed:", response);
         
//         // if (response.data) {
//         //   	const blobUrl = URL.createObjectURL(response.data);

// 				// 		// Create and trigger download
// 				// 		const link = document.createElement("a");
// 				// 		link.href = blobUrl;
// 				// 		link.download = `screenshot_${Date.now()}.pdf`;
// 				// 		document.body.appendChild(link);
// 				// 		link.click();

// 				// 		setTimeout(() => {
// 				// 			document.body.removeChild(link);
// 				// 			URL.revokeObjectURL(blobUrl);
// 				// 		}, 100);
//         // }

//         resolve(response);
//         console.log(response.data,"second time")
// 			}
// 		);
// 	});
// }

// Message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	console.log("Message received in content script:", message);
	sendResponse({ status: "received" });
	return true;
});

// Initialize on window load
window.addEventListener("load", () => {
	const videoElement = document.querySelector("video");
	if (videoElement) {
		console.log("Video element found:", {
			className: videoElement.className,
			src: videoElement.currentSrc,
			dimensions: `${videoElement.videoWidth}x${videoElement.videoHeight}`,
		});

		initializeScreenshotButton(videoElement);
	}
});
