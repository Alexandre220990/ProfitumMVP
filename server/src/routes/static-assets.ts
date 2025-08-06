import express from 'express';
import path from 'path';

const router = express.Router();

// Route pour servir les images statiques
router.get('/profitum_logo_texte.png', (req, res) => {
  // Rediriger vers une image par défaut ou retourner une réponse JSON
  res.status(200).json({
    success: true,
    message: 'Logo Profitum',
    data: {
      url: '/images/profitum-logo.png',
      alt: 'Logo Profitum'
    }
  });
});

router.get('/avatar.png', (req, res) => {
  // Rediriger vers une image par défaut ou retourner une réponse JSON
  res.status(200).json({
    success: true,
    message: 'Avatar utilisateur',
    data: {
      url: '/images/avatar-placeholder.png',
      alt: 'Avatar utilisateur'
    }
  });
});

// Route générique pour les images
router.get('/images/:filename', (req, res) => {
  const { filename } = req.params;
  
  // Liste des images disponibles
  const availableImages = [
    'profitum-logo.png',
    'avatar-placeholder.png',
    'logo.png',
    'favicon.ico'
  ];
  
  if (availableImages.includes(filename)) {
    // Retourner une image par défaut ou une réponse JSON
    res.status(200).json({
      success: true,
      message: `Image ${filename}`,
      data: {
        url: `/images/${filename}`,
        alt: filename.replace('.png', '').replace('.ico', '')
      }
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Image non trouvée',
      data: {
        url: '/images/placeholder.png',
        alt: 'Image par défaut'
      }
    });
  }
});

export default router; 