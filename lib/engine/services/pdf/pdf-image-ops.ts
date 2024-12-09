// TODO: This is hanging for some reason

import * as pdfjsLib from "pdfjs-dist";
// import { OPS } from "pdfjs-dist";

export async function extractImagesFromPdfUrl(
  pdfUrl: string
): Promise<Uint8ClampedArray[][]> {
  // Initialize PDF.js
  const loadingTask = pdfjsLib.getDocument(pdfUrl);
  const pdfDoc = await loadingTask.promise;

  const imagesByPage: Uint8ClampedArray[][] = [];

  try {
    // Iterate through each page
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      // const pdfPage = await pdfDoc.getPage(pageNum);
      // const operatorList = await pdfPage.getOperatorList();
      const images: Uint8ClampedArray[] = [];

      // Find all image operations in the page
      // for (let i = 0; i < operatorList.fnArray.length; i++) {
      //   if (operatorList.fnArray[i] === OPS.paintImageXObject) {
      //     const imgArgs = operatorList.argsArray[i];

      //     pdfPage.objs.get(imgArgs[0], (imgObj) => {
      //       if (imgObj?.data instanceof Uint8ClampedArray) {
      //         images.push(imgObj.data);
      //       }
      //     });
      //   }
      // }

      imagesByPage.push(images);
    }
  } finally {
    // Cleanup
    console.log("Destroying loading task");
    await loadingTask.destroy();
  }

  console.log("Finished extracting images");

  return imagesByPage;
}
