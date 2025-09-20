import type { IEntityView } from '@scenemesh/entity-engine';

export const aiSettingsView: IEntityView = {
  name: 'ai-settings-view',
  title: 'AI Settings',
  description: 'AI Module Settings Management',
  modelName: 'ai-settings',
  viewType: 'form',
  items: [
    {
      name: 'defaultProvider',
      title: 'Default Provider'
    },
    {
      name: 'defaultModel', 
      title: 'Default Model'
    },
    {
      name: 'temperature',
      title: 'Temperature'
    },
    {
      name: 'maxTokens',
      title: 'Max Tokens'
    },
    {
      name: 'enableTools',
      title: 'Enable Tools'
    }
  ],
  canEdit: true,
  canNew: true,
  canDelete: true
};