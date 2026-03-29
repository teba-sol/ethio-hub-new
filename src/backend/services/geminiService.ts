export const getCulturalStory = async (productName: string): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const stories: Record<string, string> = {
    'Handwoven Cotton Scarf': 'This traditional scarf represents the ancient weaving techniques passed down through generations of Ethiopian artisans. Each pattern tells a story of the Oromo people and their rich cultural heritage.',
    'Coffee Table': 'Crafted from indigenous Ethiopian coffee wood, this piece embodies the ceremonial significance of coffee in Ethiopian culture, dating back to the 9th century.',
    'Silver jewelry': 'Silverwork in Ethiopia, particularly the filigree technique, was introduced by Greek settlers in the 3rd century BC and has since become intertwined with Ethiopian Orthodox Christian traditions.',
  };
  
  for (const [key, story] of Object.entries(stories)) {
    if (productName.toLowerCase().includes(key.toLowerCase())) {
      return story;
    }
  }
  
  return 'This authentic piece was handcrafted by master artisans using traditional techniques passed down through generations, preserving Ethiopian cultural heritage.';
};

export const generateArtisanBio = async (artisanName: string): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return `${artisanName} is a third-generation master artisan dedicated to preserving traditional Ethiopian craftsmanship.`;
};