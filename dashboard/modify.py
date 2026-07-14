import json

with open('app/dashboard/chat-widget/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Interface WidgetConfig
content = content.replace(
    '  max_tokens: number;\n  updated_at: string;',
    '  max_tokens: number;\n  ai_apply_chat_widget: boolean;\n  ai_apply_whatsapp: boolean;\n  ai_goals: string[];\n  updated_at: string;'
)

# state for goals
content = content.replace(
    '  const [isEditingKey, setIsEditingKey] = useState(false);',
    '''  const [isEditingKey, setIsEditingKey] = useState(false);
  const [hasPaymentConfig, setHasPaymentConfig] = useState(false);
  const [hasCalendarConfig, setHasCalendarConfig] = useState(false);'''
)

# fetchConfig
fetch_config_repl = '''      if (res.ok) {
        const data: WidgetConfig = await res.json();
        // Ensure rules_config is always a valid array (backend may send a JSON string)
        setConfig({ ...data, rules_config: normalizeRules(data.rules_config) });
      }
      
      const resPayment = await fetch(`${API}/clients/me/payment-config`, {
        headers: { Authorization: `Bearer ${session.backendToken}` },
      });
      if (resPayment.ok) {
        const pData = await resPayment.json();
        if (pData.provider && pData.provider !== "none") {
          setHasPaymentConfig(true);
        }
        if (pData.provider_keys && pData.provider_keys.google_calendar_refresh_token) {
          setHasCalendarConfig(true);
        }
      }'''

content = content.replace(
'''      if (res.ok) {
        const data: WidgetConfig = await res.json();
        // Ensure rules_config is always a valid array (backend may send a JSON string)
        setConfig({ ...data, rules_config: normalizeRules(data.rules_config) });
      }''', fetch_config_repl
)

# handleSave
save_payload = '''          temperature:      config.temperature,
          max_tokens:       config.max_tokens,
          ai_apply_chat_widget: config.ai_apply_chat_widget ?? true,
          ai_apply_whatsapp: config.ai_apply_whatsapp ?? true,
          ai_goals:         config.ai_goals || [],'''
content = content.replace(
    '''          temperature:      config.temperature,
          max_tokens:       config.max_tokens,''',
    save_payload
)

# UI changes
ui_changes = '''        <div className="bg-dark-card backdrop-blur-xl border border-dark-card-border rounded-[2rem] p-6 md:p-8 space-y-6">
          <SectionTitle icon={<Brain size={22} />} title="Configuración Master IA" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
             <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-dark-card-border">
                <div>
                   <h4 className="text-white font-medium text-sm">Chat Widget</h4>
                   <p className="text-gray-400 text-xs mt-0.5">Aplicar estas instrucciones al widget web</p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, ai_apply_chat_widget: config.ai_apply_chat_widget === undefined ? false : !config.ai_apply_chat_widget })}
                  className={`${(config.ai_apply_chat_widget ?? true) ? 'text-neon-green' : 'text-gray-500 hover:text-gray-400'} transition-colors`}
                >
                  {(config.ai_apply_chat_widget ?? true) ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                </button>
             </div>
             
             <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-dark-card-border">
                <div>
                   <h4 className="text-white font-medium text-sm">WhatsApp Virtual Setter</h4>
                   <p className="text-gray-400 text-xs mt-0.5">Aplicar estas instrucciones al bot de WhatsApp</p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, ai_apply_whatsapp: config.ai_apply_whatsapp === undefined ? false : !config.ai_apply_whatsapp })}
                  className={`${(config.ai_apply_whatsapp ?? true) ? 'text-neon-purple' : 'text-gray-500 hover:text-gray-400'} transition-colors`}
                >
                  {(config.ai_apply_whatsapp ?? true) ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                </button>
             </div>
          </div>'''

content = content.replace(
'''        <div className="bg-dark-card backdrop-blur-xl border border-dark-card-border rounded-[2rem] p-6 md:p-8 space-y-6">
          <SectionTitle icon={<Brain size={22} />} title="Configuración de IA" />''',
    ui_changes
)

# Goals section
goals_ui = '''
            <div className="md:col-span-3 pt-6 border-t border-dark-card-border">
              <h4 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-neon-green" />
                Metas (Goals)
              </h4>
              <p className="text-gray-400 text-xs mb-4">Activa las metas que la IA debe perseguir al conversar con los prospectos. Las metas se añadirán automáticamente a las instrucciones de la IA.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${hasCalendarConfig ? 'bg-white/[0.02] border-white/10 hover:bg-white/[0.04]' : 'bg-black/20 border-white/5 opacity-60'}`}>
                  <div>
                    <h5 className="text-sm text-white flex items-center gap-2">
                      Agendar <span className="text-[10px] uppercase font-bold bg-gray-800 text-gray-300 px-1.5 rounded">Calendario</span>
                    </h5>
                    <p className="text-xs text-gray-400 mt-1">
                      {hasCalendarConfig ? 'La IA revisará tu disponibilidad y agendará reuniones.' : 'Conecta tu calendario de Google para activar esta meta.'}
                    </p>
                  </div>
                  {hasCalendarConfig && (
                    <button
                      type="button"
                      onClick={() => {
                         const goals = config.ai_goals || [];
                         if (goals.includes('agendar')) {
                            setConfig({ ...config, ai_goals: goals.filter((g: string) => g !== 'agendar') });
                         } else {
                            setConfig({ ...config, ai_goals: [...goals, 'agendar'] });
                         }
                      }}
                      className={`${(config.ai_goals || []).includes('agendar') ? 'text-neon-green' : 'text-gray-500'} transition-colors`}
                    >
                      {(config.ai_goals || []).includes('agendar') ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                    </button>
                  )}
                </div>

                <div className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${hasPaymentConfig ? 'bg-white/[0.02] border-white/10 hover:bg-white/[0.04]' : 'bg-black/20 border-white/5 opacity-60'}`}>
                  <div>
                    <h5 className="text-sm text-white flex items-center gap-2">
                      Cobrar <span className="text-[10px] uppercase font-bold bg-gray-800 text-gray-300 px-1.5 rounded">Pagos</span>
                    </h5>
                    <p className="text-xs text-gray-400 mt-1">
                      {hasPaymentConfig ? 'La IA solicitará y gestionará el cobro (consultas, iniciales, etc).' : 'Configura Stripe, PayPal o similar para activar.'}
                    </p>
                  </div>
                  {hasPaymentConfig && (
                    <button
                      type="button"
                      onClick={() => {
                         const goals = config.ai_goals || [];
                         if (goals.includes('cobrar')) {
                            setConfig({ ...config, ai_goals: goals.filter((g: string) => g !== 'cobrar') });
                         } else {
                            setConfig({ ...config, ai_goals: [...goals, 'cobrar'] });
                         }
                      }}
                      className={`${(config.ai_goals || []).includes('cobrar') ? 'text-neon-green' : 'text-gray-500'} transition-colors`}
                    >
                      {(config.ai_goals || []).includes('cobrar') ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
'''

content = content.replace(
'''            <div className="md:col-span-3">
              <Field
                label="Protocolo de Seguridad"
                hint="Reglas que la IA nunca puede violar (inyectadas al final del prompt)"
              >
                <textarea
                  rows={4}
                  value={config.security_protocol ?? ""}
                  onChange={(e) => setConfig({ ...config, security_protocol: e.target.value || null })}
                  className={textareaCls}
                  placeholder="Ej: Nunca prometas precios exactos. No hagas declaraciones legales. Si el usuario menciona competidores, redirige la conversación hacia nuestras fortalezas..."
                />
              </Field>
            </div>
          </div>''',
'''            <div className="md:col-span-3">
              <Field
                label="Protocolo de Seguridad"
                hint="Reglas que la IA nunca puede violar (inyectadas al final del prompt)"
              >
                <textarea
                  rows={4}
                  value={config.security_protocol ?? ""}
                  onChange={(e) => setConfig({ ...config, security_protocol: e.target.value || null })}
                  className={textareaCls}
                  placeholder="Ej: Nunca prometas precios exactos. No hagas declaraciones legales. Si el usuario menciona competidores, redirige la conversación hacia nuestras fortalezas..."
                />
              </Field>
            </div>
''' + goals_ui
)

with open('app/dashboard/chat-widget/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done modifying chat-widget/page.tsx')
