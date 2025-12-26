// Scenario translations for i18n
export const scenarioTranslations: Record<string, { name: Record<'en' | 'zh', string>; description: Record<'en' | 'zh', string>; eventText?: Record<'en' | 'zh', string> }> = {
  '1-1': {
    name: {
      en: '1-1: 1990 Market',
      zh: '1-1: 1990年市场'
    },
    description: {
      en: '1990. Newbie tutorial level, extremely low volatility.',
      zh: '1990年。新手教学关卡，波动率极低。'
    },
    eventText: {
      en: 'Everything is fine, except for boredom.',
      zh: '一切安好，除了无聊。'
    }
  },
  '1-2': {
    name: {
      en: '1-2: 1995 Market',
      zh: '1-2: 1995年市场'
    },
    description: {
      en: '1995. Tech stocks began to receive attention.',
      zh: '1995年。科技股开始受到关注。'
    }
  },
  '1-3': {
    name: {
      en: '1-3: 1997 Market',
      zh: '1-3: 1997年市场'
    },
    description: {
      en: '1997. External shocks began to affect global markets.',
      zh: '1997年。外部冲击开始影响全球市场。'
    }
  },
  '1-4': {
    name: {
      en: '1-4: 1999 Market',
      zh: '1-4: 1999年市场'
    },
    description: {
      en: '1999. Market frenzy, but undercurrents are stirring.',
      zh: '1999年。市场狂热，但暗流涌动。'
    }
  },
  '1-5': {
    name: {
      en: '1-5: BOSS - 2000 Market',
      zh: '1-5: BOSS - 2000年市场'
    },
    description: {
      en: '2000. Market volatility intensifies.',
      zh: '2000年。市场剧烈波动。'
    }
  },
  '2-1': {
    name: {
      en: '2-1: 2001 Market',
      zh: '2-1: 2001年市场'
    },
    description: {
      en: '2001. Corporate fraud triggers market trust crisis.',
      zh: '2001年。企业欺诈引发市场信任危机。'
    }
  },
  '2-2': {
    name: {
      en: '2-2: 2005 Market',
      zh: '2-2: 2005年市场'
    },
    description: {
      en: '2005. Subprime market expands wildly.',
      zh: '2005年。次贷市场疯狂扩张。'
    }
  },
  '2-3': {
    name: {
      en: '2-3: 2007 Market',
      zh: '2-3: 2007年市场'
    },
    description: {
      en: '2007. Subprime default rates surge.',
      zh: '2007年。次贷违约率飙升。'
    }
  },
  '3-1': {
    name: {
      en: '3-1: 2010 Market',
      zh: '3-1: 2010年市场'
    },
    description: {
      en: '2010. Post-crisis recovery begins.',
      zh: '2010年。危机后复苏开始。'
    }
  },
  '3-2': {
    name: {
      en: '3-2: 2011 Market',
      zh: '3-2: 2011年市场'
    },
    description: {
      en: '2011. Greek debt crisis triggers European market turmoil.',
      zh: '2011年。希腊债务危机引发欧洲市场动荡。'
    }
  },
  '4-1': {
    name: {
      en: '4-1: 2020 Market',
      zh: '4-1: 2020年市场'
    },
    description: {
      en: '2020. Global pandemic shocks markets.',
      zh: '2020年。全球疫情冲击市场。'
    }
  },
};

// Helper function to extract base ID and get translation or fallback
export const getScenarioTranslation = (scenarioId: string, lang: 'en' | 'zh'): { name: string; description: string; eventText?: string } => {
  // Extract base ID (e.g., '1-1-p1' -> '1-1')
  const baseId = scenarioId.split('-p')[0];
  const translation = scenarioTranslations[baseId];
  
  if (translation) {
    return {
      name: translation.name[lang],
      description: translation.description[lang],
      eventText: translation.eventText?.[lang]
    };
  }
  
  // Fallback: try to extract year and create a generic name
  const yearMatch = scenarioId.match(/(\d{4})/);
  if (yearMatch) {
    const year = yearMatch[1];
    return {
      name: lang === 'en' ? `${baseId}: ${year} Market` : `${baseId}: ${year}年市场`,
      description: lang === 'en' ? `${year}. Market scenario.` : `${year}年。市场场景。`,
      eventText: lang === 'en' ? 'Market conditions.' : '市场状况。'
    };
  }
  
  // Final fallback
  return {
    name: baseId,
    description: '',
    eventText: ''
  };
};

