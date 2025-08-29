import React from 'react';
import { LanguageFilterProps } from '../types';

function LanguageFilter({ languages, selected, onChange, onCheckAll, onUncheckAll }: LanguageFilterProps) {
  return (
    <div className="language-filter-content">
      <div className="language-filter-actions">
        <button onClick={onCheckAll} className="filter-btn">
          Select All
        </button>
        <button onClick={onUncheckAll} className="filter-btn">
          Deselect All
        </button>
      </div>
      <div className="language-filter-list">
        {languages.map(lang => (
          <label key={lang} className="language-option">
            <input
              type="checkbox"
              checked={selected.includes(lang)}
              onChange={() => onChange(lang)}
            />
            <span>{lang}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default LanguageFilter;