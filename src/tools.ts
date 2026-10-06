import { createElement, lazy } from 'react';
import FormatterTool from './components/FormatterTool';
import ImageIcon from './components/ImageIcon';

const ImageTool = lazy(() => import('./components/ImageTool'));
const TextCaseTool = lazy(() => import('./components/TextCaseTool'));
const SQLTool = lazy(() => import('./components/SQLTool'));

// Register new utilities here to add a menu entry and its workspace.
export const tools = [
  { id: 'formatter', path: '/formatter', label: 'Formatter', icon: '{ }', component: FormatterTool },
  { id: 'image', path: '/image', label: 'Image', icon: createElement(ImageIcon), component: ImageTool },
  { id: 'text-case', path: '/text-case', label: 'Text Case', icon: 'Aa', component: TextCaseTool },
  { id: 'sql', path: '/sql', label: 'SQL', icon: 'SQL', component: SQLTool },
] as const;

export type ToolId = typeof tools[number]['id'];
