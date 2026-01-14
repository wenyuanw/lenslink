
import { PhotoGroup, PhotoFile, GroupStatus, SelectionState, ExifData } from '../types';

const RAW_EXTENSIONS = ['ARW', 'CR2', 'NEF', 'DNG', 'ORF', 'RAF', 'SRW'];

export const groupFiles = async (files: File[]): Promise<PhotoGroup[]> => {
  const groups: Record<string, Partial<PhotoGroup>> = {};

  for (const file of files) {
    const lastDotIndex = file.name.lastIndexOf('.');
    if (lastDotIndex === -1) continue;

    const baseName = file.name.substring(0, lastDotIndex);
    const extension = file.name.substring(lastDotIndex + 1).toUpperCase();

    if (!groups[baseName]) {
      groups[baseName] = {
        id: baseName,
        selection: SelectionState.UNMARKED,
        exif: mockExif(baseName) // In a real app, we'd use a library to parse the file
      };
    }

    const photoFile: PhotoFile = {
      name: file.name,
      extension,
      file,
      previewUrl: extension === 'JPG' ? URL.createObjectURL(file) : 'https://picsum.photos/seed/' + baseName + '/800/600',
      size: file.size
    };

    if (extension === 'JPG') {
      groups[baseName].jpg = photoFile;
    } else if (RAW_EXTENSIONS.includes(extension)) {
      groups[baseName].raw = photoFile;
    }
  }

  return Object.values(groups).map(g => {
    let status = GroupStatus.COMPLETE;
    if (g.jpg && !g.raw) status = GroupStatus.JPG_ONLY;
    if (!g.jpg && g.raw) status = GroupStatus.RAW_ONLY;
    
    return { ...g, status } as PhotoGroup;
  });
};

export const mockExif = (name: string): ExifData => {
  const shutters = ['1/100', '1/250', '1/1000', '1/4000', '1/60'];
  const apertures = ['f/1.8', 'f/2.8', 'f/4', 'f/8', 'f/11'];
  const isos = ['100', '400', '800', '1600', '3200'];
  const lenses = ['35mm f/1.4', '24-70mm f/2.8', '85mm f/1.8', '70-200mm f/2.8'];
  
  return {
    shutterSpeed: shutters[Math.floor(Math.random() * shutters.length)],
    aperture: apertures[Math.floor(Math.random() * apertures.length)],
    iso: isos[Math.floor(Math.random() * isos.length)],
    focalLength: (Math.floor(Math.random() * 200) + 24) + 'mm',
    dateTime: new Date().toLocaleString(),
    model: 'Sony α7 IV',
    lens: lenses[Math.floor(Math.random() * lenses.length)]
  };
};

export const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
