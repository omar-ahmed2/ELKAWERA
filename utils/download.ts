import { toPng } from 'html-to-image';

/**
 * Downloads a DOM element as a high-quality PNG image.
 * Uses html-to-image for better support of CSS gradients, filters, and SVGs.
 */
export const downloadElementAsPNG = async (elementId: string, fileName: string) => {
  const originalElement = document.getElementById(elementId);
  if (!originalElement) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  try {
    // 1. Clone the node to modify it safely without affecting the UI
    const clonedElement = originalElement.cloneNode(true) as HTMLElement;

    // 2. Setup Off-screen Container
    // This container ensures the card is rendered in a clean environment with correct dimensions.
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '-9999px';
    container.style.width = '320px'; // Natural width of the card
    container.style.height = '480px'; // Natural height of the card
    container.style.zIndex = '-9999';
    container.style.overflow = 'hidden';
    container.style.backgroundColor = 'transparent';
    document.body.appendChild(container);

    // 3. Prepare the cloned element for capture
    // We strip 3D transforms and rotations to get a "flat" version of the card side.
    // This is crucial for the back side which is normally rotated 180deg.
    clonedElement.style.setProperty('transform', 'none', 'important');
    clonedElement.style.setProperty('perspective', 'none', 'important');
    clonedElement.style.setProperty('transform-style', 'flat', 'important');
    clonedElement.style.setProperty('box-shadow', 'none', 'important');
    clonedElement.style.setProperty('transition', 'none', 'important');
    clonedElement.style.setProperty('margin', '0', 'important');
    clonedElement.style.setProperty('position', 'relative', 'important');
    clonedElement.style.setProperty('top', '0', 'important');
    clonedElement.style.setProperty('left', '0', 'important');
    clonedElement.style.width = '320px';
    clonedElement.style.height = '480px';
    clonedElement.style.borderRadius = '32px 32px 24px 24px'; // Match original card corners

    // Ensure visibility
    clonedElement.style.setProperty('backface-visibility', 'visible', 'important');
    clonedElement.style.setProperty('visibility', 'visible', 'important');
    clonedElement.style.setProperty('opacity', '1', 'important');

    // 4. Remove unwanted elements (Likes / Interaction icons)
    // We use the data attribute we added and also search for specific interaction classes
    const removeUnwanted = (el: HTMLElement) => {
      const targets = el.querySelectorAll('[data-download-ignore="true"], .download-ignore');
      targets.forEach(t => t.remove());
    };
    removeUnwanted(clonedElement);

    // Clean up Tailwind classes that might interfere with flat rendering
    const classesToRemove = [
      'rotate-y-180',
      'flip-transition',
      'backface-hidden',
      'transform-style-3d',
      'perspective-1000',
      'group',
      'hover:scale-105',
      'hover:scale-[1.02]',
      'hover:-translate-y-2'
    ];
    classesToRemove.forEach(cls => clonedElement.classList.remove(cls));

    container.appendChild(clonedElement);

    // 5. High-fidelity Capture using html-to-image
    // pixelRatio: 3 or 4 provides a crisp, high-resolution result suitable for sharing.
    const dataUrl = await toPng(clonedElement, {
      quality: 1.0,
      pixelRatio: 4,
      backgroundColor: 'transparent',
      cacheBust: true,
      style: {
        // Ensure gradients and filters are captured correctly
        transform: 'none',
      },
      // Filter redundant elements
      filter: (node: any) => {
        if (node.getAttribute) {
          return node.getAttribute('data-download-ignore') !== 'true';
        }
        return true;
      }
    });

    // 6. Cleanup
    document.body.removeChild(container);

    // 7. Download the result
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (error) {
    console.error('Error exporting player card:', error);
  }
};