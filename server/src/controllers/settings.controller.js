import { getSettings, updateSettings } from '../services/settingsService.js';

/** GET /api/settings — público */
export async function getPublic(_req, res) {
  res.set('Cache-Control', 'no-cache');
  res.json({ settings: await getSettings() });
}

/** PUT /api/admin/settings */
export async function update(req, res) {
  res.json({ settings: await updateSettings(req.body) });
}
