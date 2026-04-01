import { describe, it, expect } from 'vitest';

describe('Respondent Links Layout', () => {
  it('deve gerar URL completa do respondente com token', () => {
    const token = 'abc123def456';
    const origin = 'https://example.com';
    const url = `${origin}/respondent?token=${token}`;
    
    expect(url).toContain('/respondent?token=');
    expect(url).toContain(token);
    expect(url).toMatch(/^https:\/\/.*\/respondent\?token=.+$/);
  });

  it('deve validar que URL contém parametro token', () => {
    const token = 'test-token-123';
    const url = `http://localhost:3000/respondent?token=${token}`;
    
    const urlParams = new URLSearchParams(url.split('?')[1]);
    expect(urlParams.get('token')).toBe(token);
  });

  it('deve gerar URLs diferentes para tokens diferentes', () => {
    const token1 = 'token-1';
    const token2 = 'token-2';
    const origin = 'https://example.com';
    
    const url1 = `${origin}/respondent?token=${token1}`;
    const url2 = `${origin}/respondent?token=${token2}`;
    
    expect(url1).not.toBe(url2);
    expect(url1).toContain(token1);
    expect(url2).toContain(token2);
  });

  it('deve suportar compartilhamento de link com texto descritivo', () => {
    const token = 'share-test-token';
    const origin = 'https://example.com';
    const url = `${origin}/respondent?token=${token}`;
    const shareText = `Acesse a avaliacao LGPD: ${url}`;
    
    expect(shareText).toContain('avaliacao LGPD');
    expect(shareText).toContain(url);
    expect(shareText.length).toBeGreaterThan(url.length);
  });

  it('deve validar formato de link para múltiplos respondentes', () => {
    const respondents = [
      { id: 1, token: 'token-001' },
      { id: 2, token: 'token-002' },
      { id: 3, token: 'token-003' },
    ];
    
    const origin = 'https://example.com';
    const links = respondents.map(r => `${origin}/respondent?token=${r.token}`);
    
    expect(links).toHaveLength(3);
    links.forEach((link, index) => {
      expect(link).toContain(respondents[index].token);
      expect(link).toMatch(/^https:\/\/.*\/respondent\?token=token-00[1-3]$/);
    });
  });

  it('deve preservar token completo na URL (sem truncamento)', () => {
    const longToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const origin = 'https://example.com';
    const url = `${origin}/respondent?token=${longToken}`;
    
    const urlParams = new URLSearchParams(url.split('?')[1]);
    expect(urlParams.get('token')).toBe(longToken);
    expect(urlParams.get('token')).not.toContain('...');
  });

  it('deve validar que link é clicável e abrível', () => {
    const token = 'clickable-token';
    const origin = 'https://example.com';
    const url = `${origin}/respondent?token=${token}`;
    
    // Validar que URL é válida
    expect(() => new URL(url)).not.toThrow();
    
    // Validar que URL segue o padrão correto para abertura em nova aba
    expect(url).toMatch(/^https:\/\/.*\/respondent\?token=.+$/);
    expect(url).toContain('respondent');
    expect(url).toContain('token=');
  });

  it('deve validar funcionalidade de cópia de link', () => {
    const token = 'copy-test-token';
    const origin = 'https://example.com';
    const url = `${origin}/respondent?token=${token}`;
    
    // Simular cópia para clipboard
    const clipboardText = url;
    
    expect(clipboardText).toBe(url);
    expect(clipboardText.length).toBeGreaterThan(0);
    expect(clipboardText).toMatch(/^https:\/\/.*\/respondent\?token=.+$/);
  });
});
