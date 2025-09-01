/**
 * Service for capturing Mermaid diagrams as images
 */

export interface DiagramData {
  mermaidCode: string
  diagramImage: string
  prompt: string
}

/**
 * Captures a Mermaid diagram as a base64 image
 * @param diagramContainer - The DOM element containing the rendered diagram
 * @returns Promise<string> - Base64 encoded image data
 */
export const captureDiagramAsImage = async (diagramContainer: HTMLElement): Promise<string> => {
  try {
    // Find the SVG element within the diagram container
    const svgElement = diagramContainer.querySelector('svg')
    if (!svgElement) {
      throw new Error('No SVG element found in diagram container')
    }

    // Create a canvas to render the SVG
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Could not get canvas context')
    }

    // Get SVG dimensions
    const svgRect = svgElement.getBoundingClientRect()
    const width = svgRect.width
    const height = svgRect.height

    // Set canvas dimensions
    canvas.width = width
    canvas.height = height

    // Create a blob from the SVG
    const svgData = new XMLSerializer().serializeToString(svgElement)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    // Create an image element to load the SVG
    const img = new Image()
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        // Draw the image to canvas
        ctx.drawImage(img, 0, 0, width, height)
        
        // Convert to base64
        const base64Data = canvas.toDataURL('image/png')
        
        // Clean up
        URL.revokeObjectURL(url)
        
        resolve(base64Data)
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load SVG as image'))
      }
      
      img.src = url
    })
  } catch (error) {
    console.error('Error capturing diagram as image:', error)
    throw error
  }
}

/**
 * Prepares diagram data for discussion
 * @param mermaidCode - The Mermaid diagram code
 * @param prompt - The original prompt
 * @param diagramContainer - Optional container element for image capture
 * @returns Promise<DiagramData> - Complete diagram data
 */
export const prepareDiagramData = async (
  mermaidCode: string,
  prompt: string,
  diagramContainer?: HTMLElement
): Promise<DiagramData> => {
  let diagramImage = ''
  
  if (diagramContainer) {
    try {
      diagramImage = await captureDiagramAsImage(diagramContainer)
    } catch (error) {
      console.warn('Failed to capture diagram image:', error)
      // Continue without image if capture fails
    }
  }

  return {
    mermaidCode,
    diagramImage,
    prompt
  }
}
