import type { IEntityModel } from '@scenemesh/entity-engine';

export const aiProviderModel: IEntityModel = {
  name: 'ai-provider',
  title: 'AI Provider',
  description: 'AI Provider Configuration',
  fields: [
    {
      name: 'providerId',
      title: 'Provider ID',
      type: 'string',
      isRequired: true
    },
    {
      name: 'providerName',
      title: 'Provider Name',
      type: 'string',
      isRequired: true
    },
    {
      name: 'baseURL',
      title: 'Base URL',
      type: 'string',
      isRequired: true
    },
    {
      name: 'apiKey',
      title: 'API Key',
      type: 'string',
      isRequired: true
    },
    {
      name: 'models',
      title: 'Available Models',
      type: 'json',
      defaultValue: []
    },
    {
      name: 'isActive',
      title: 'Is Active',
      type: 'boolean',
      defaultValue: true
    }
  ]
};