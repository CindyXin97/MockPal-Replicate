'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Input } from './input';
import { TARGET_COMPANIES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface CompanyAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CompanyAutocomplete({
  value,
  onChange,
  placeholder = "请输入公司名称",
  className,
  disabled = false
}: CompanyAutocompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCompanies, setFilteredCompanies] = useState(TARGET_COMPANIES);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // 初始化输入值
  useEffect(() => {
    if (value) {
      // 如果value是公司key，找到对应的label
      const company = TARGET_COMPANIES.find(c => c.value === value);
      setInputValue(company ? company.label : value);
    }
  }, [value]);

  // 过滤公司列表
  const filterCompanies = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      return TARGET_COMPANIES;
    }
    
    return TARGET_COMPANIES.filter(company =>
      company.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.value.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // 过滤公司列表
    const filtered = filterCompanies(newValue);
    setFilteredCompanies(filtered);
    
    // 显示建议
    setShowSuggestions(true);
    setSelectedIndex(-1);
    
    // 如果没有匹配的公司，直接使用输入值
    if (filtered.length === 0) {
      onChange(newValue);
    }
  };

  // 处理公司选择
  const handleCompanySelect = (company: typeof TARGET_COMPANIES[0]) => {
    setInputValue(company.label);
    onChange(company.value);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  // 处理键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredCompanies.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCompanies.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCompanies.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredCompanies.length) {
          handleCompanySelect(filteredCompanies[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // 处理焦点事件
  const handleFocus = () => {
    setShowSuggestions(true);
    // 如果输入为空，显示所有公司
    if (!inputValue.trim()) {
      setFilteredCompanies(TARGET_COMPANIES);
    }
  };

  const handleBlur = () => {
    // 延迟隐藏，让点击事件先触发
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 150);
  };

  // 点击外部关闭建议
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        autoComplete="off"
      />
      
      {showSuggestions && filteredCompanies.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredCompanies.map((company, index) => (
            <div
              key={company.value}
              className={cn(
                "px-3 py-2 cursor-pointer text-sm transition-colors",
                "hover:bg-gray-50",
                index === selectedIndex && "bg-blue-50 text-blue-600"
              )}
              onClick={() => handleCompanySelect(company)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="font-medium">{company.label}</div>
            </div>
          ))}
          
          {/* 如果没有匹配的公司，显示自定义选项 */}
          {filteredCompanies.length === 0 && inputValue.trim() && (
            <div
              className="px-3 py-2 cursor-pointer text-sm text-gray-500 hover:bg-gray-50"
              onClick={() => {
                onChange(inputValue);
                setShowSuggestions(false);
              }}
            >
              使用自定义公司名称: "{inputValue}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
