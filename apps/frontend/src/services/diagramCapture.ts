/**
 * Service for capturing Mermaid diagrams as images
 */

export interface DiagramData {
  mermaidCode: string
  diagramImage: string
  prompt: string
}

/**
 * Captures a Mermaid diagram as a base64 image using a CORS-safe approach
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

    // Clone the SVG to avoid modifying the original
    const clonedSvg = svgElement.cloneNode(true) as SVGElement
    
    // Set CORS attributes to prevent tainted canvas
    clonedSvg.setAttribute('crossorigin', 'anonymous')
    
    // Get SVG dimensions
    const svgRect = svgElement.getBoundingClientRect()
    const width = svgRect.width || 800
    const height = svgRect.height || 600

    // Set explicit dimensions on the cloned SVG
    clonedSvg.setAttribute('width', width.toString())
    clonedSvg.setAttribute('height', height.toString())
    clonedSvg.setAttribute('viewBox', `0 0 ${width} ${height}`)

    // Create a canvas to render the SVG
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Could not get canvas context')
    }

    // Set canvas dimensions
    canvas.width = width
    canvas.height = height

    // Create a blob from the SVG with proper CORS headers
    const svgData = new XMLSerializer().serializeToString(clonedSvg)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    // Create an image element to load the SVG
    const img = new Image()
    img.crossOrigin = 'anonymous' // Set CORS attribute
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        try {
          // Draw the image to canvas
          ctx.drawImage(img, 0, 0, width, height)
          
          // Convert to base64
          const base64Data = canvas.toDataURL('image/png')
          
          // Clean up
          URL.revokeObjectURL(url)
          
          resolve(base64Data)
        } catch (canvasError) {
          URL.revokeObjectURL(url)
          const errorMessage = canvasError instanceof Error ? canvasError.message : 'Unknown canvas error'
          reject(new Error(`Canvas rendering failed: ${errorMessage}`))
        }
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
      console.log('📸 Attempting to capture diagram image...')
      diagramImage = await captureDiagramAsImage(diagramContainer)
      console.log('✅ Diagram image captured successfully')
    } catch (error) {
      console.warn('⚠️ Failed to capture diagram image, continuing without image:', error)
      // Continue without image if capture fails - the Mermaid code is the primary data
    }
  } else {
    console.log('📝 No diagram container provided, skipping image capture')
  }

  const diagramData = {
    mermaidCode,
    diagramImage,
    prompt
  }
  
  console.log('📊 Prepared diagram data:', {
    hasMermaidCode: !!mermaidCode,
    mermaidCodeLength: mermaidCode.length,
    hasImage: !!diagramImage,
    imageLength: diagramImage.length,
    hasPrompt: !!prompt
  })

  return diagramData
}
