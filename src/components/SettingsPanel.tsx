import React from 'react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  language: 'zh' | 'en';
  onThemeChange: (theme: 'light' | 'dark') => void;
  onLanguageChange: (language: 'zh' | 'en') => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  theme,
  language,
  onThemeChange,
  onLanguageChange,
}) => {
  if (!isOpen) return null;

  const t = {
    zh: {
      settings: '设置',
      theme: '主题',
      light: '浅色模式',
      dark: '深色模式',
      language: '语言',
      chinese: '中文',
      english: 'English',
      close: '关闭'
    },
    en: {
      settings: 'Settings',
      theme: 'Theme',
      light: 'Light Mode',
      dark: 'Dark Mode',
      language: 'Language',
      chinese: '中文',
      english: 'English',
      close: 'Close'
    }
  };

  const text = t[language];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Settings Panel */}
      <div className={`fixed top-16 right-6 w-80 border rounded-xl shadow-2xl z-50 overflow-hidden ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${theme === 'dark' ? 'border-zinc-800' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{text.settings}</h3>
          <button
            onClick={onClose}
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${theme === 'dark' ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Theme Setting */}
          <div>
            <label className={`block text-sm font-bold mb-3 ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
              <i className="fa-solid fa-palette mr-2"></i>
              {text.theme}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => onThemeChange('light')}
                className={`flex-1 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                  theme === 'light'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                }`}
              >
                <i className="fa-solid fa-sun mr-2"></i>
                {text.light}
              </button>
              <button
                onClick={() => onThemeChange('dark')}
                className={`flex-1 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                  theme === 'dark'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                }`}
              >
                <i className="fa-solid fa-moon mr-2"></i>
                {text.dark}
              </button>
            </div>
          </div>

          {/* Language Setting */}
          <div>
            <label className={`block text-sm font-bold mb-3 ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
              <i className="fa-solid fa-language mr-2"></i>
              {text.language}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => onLanguageChange('zh')}
                className={`flex-1 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                  language === 'zh'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                }`}
              >
                {text.chinese}
              </button>
              <button
                onClick={() => onLanguageChange('en')}
                className={`flex-1 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                  language === 'en'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                }`}
              >
                {text.english}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPanel;
