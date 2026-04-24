const MAX_IMAGE_DIMENSION = 1200;
const JPEG_QUALITY = 0.82;

function read_file_as_data_url(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('The selected file could not be read as an image.'));
    };
    reader.onerror = () => reject(new Error('The selected file could not be read.'));
    reader.readAsDataURL(file);
  });
}

function load_image(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The uploaded file is not a valid image.'));
    image.src = source;
  });
}

function get_scaled_size(width: number, height: number) {
  const scale = Math.min(MAX_IMAGE_DIMENSION / width, MAX_IMAGE_DIMENSION / height, 1);

  return {
    width: Math.max(Math.round(width * scale), 1),
    height: Math.max(Math.round(height * scale), 1),
  };
}

export async function create_uploaded_image_data_url(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a JPG, PNG, or WebP image file.');
  }

  const original_data_url = await read_file_as_data_url(file);
  const image = await load_image(original_data_url);
  const { width, height } = get_scaled_size(
    image.naturalWidth || image.width,
    image.naturalHeight || image.height,
  );
  const canvas = document.createElement('canvas');

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Image upload is not supported in this browser.');
  }

  context.drawImage(image, 0, 0, width, height);

  const output_type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  return canvas.toDataURL(
    output_type,
    output_type === 'image/jpeg' ? JPEG_QUALITY : undefined,
  );
}
