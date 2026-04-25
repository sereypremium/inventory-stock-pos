import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { Box } from '@mui/material';
import { useState } from 'react';

interface ProductCardImageProps {
  imageUrl?: string;
  alt: string;
}

export function ProductCardImage({ imageUrl, alt }: ProductCardImageProps) {
  const [hasError, setHasError] = useState(false);
  const showImage = Boolean(imageUrl && !hasError);

  return (
    <Box
      sx={{
        alignItems: 'center',
        backgroundColor: showImage ? 'rgba(15, 91, 79, 0.04)' : 'rgba(15, 91, 79, 0.06)',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
        display: 'flex',
        flexShrink: 0,
        height: { xs: 76, sm: 82 },
        justifyContent: 'center',
        overflow: 'hidden',
        width: { xs: 76, sm: 82 },
      }}
    >
      {showImage ? (
        <Box
          alt={alt}
          className="pos-product-image-inner"
          component="img"
          decoding="async"
          loading="lazy"
          onError={() => setHasError(true)}
          src={imageUrl}
          sx={{
            display: 'block',
            height: '100%',
            objectFit: 'cover',
            transform: 'scale(1)',
            transition: 'transform 120ms ease',
            width: '100%',
          }}
        />
      ) : (
        <Inventory2OutlinedIcon color="disabled" fontSize="small" />
      )}
    </Box>
  );
}
