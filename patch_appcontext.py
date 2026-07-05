import re

with open('context/AppContext.tsx', 'r') as f:
    content = f.read()

# 1. Imports
content = content.replace("import { getPHAraligi, hesaplaParfumPHSkoruPure, hesaplaPHPure } from '@/engine';", "import { getPHAraligi, hesaplaParfumPHSkoruPure, hesaplaPHPure } from '@/engine';\nimport { hapticSuccess } from '@/utils/haptics';")

# 2. toggleFavoriteParfum
old_toggle = """  const toggleFavoriteParfum = useCallback(async (parfumId: string): Promise<boolean> => {
    try {
      const index = favorites.indexOf(parfumId);
      let newFavorites = [...favorites];
      let isFavorite = false;
      
      if (index > -1) {
        newFavorites.splice(index, 1);
      } else {
        newFavorites.push(parfumId);
        isFavorite = true;
      }
      
      setFavorites(newFavorites);
      await saveFavoriteParfums(newFavorites);
      return isFavorite;
    } catch (error) {
      console.error('Favori değiştirme hatası:', error);
      return false;
    }
  }, [favorites]);"""

new_toggle = """  const toggleFavoriteParfum = useCallback(async (parfumId: string): Promise<boolean> => {
    try {
      const index = favorites.indexOf(parfumId);
      let newFavorites = [...favorites];
      let isFavorite = false;
      
      if (index > -1) {
        newFavorites.splice(index, 1);
      } else {
        newFavorites.push(parfumId);
        isFavorite = true;
      }
      
      setFavorites(newFavorites);
      await saveFavoriteParfums(newFavorites);
      hapticSuccess(); // Favori durumu değiştiğinde haptic
      return isFavorite;
    } catch (error) {
      console.error('Favori değiştirme hatası:', error);
      return false;
    }
  }, [favorites]);"""

content = content.replace(old_toggle, new_toggle)

with open('context/AppContext.tsx', 'w') as f:
    f.write(content)

