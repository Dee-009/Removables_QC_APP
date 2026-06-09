import React, { useState } from 'react';
import { QCLog } from '@/api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { TEAMS, TECHNICIANS_BY_TEAM, ALL_TECHNICIANS } from '@/lib/teamsData';

const REJECT_TYPES_DEFAULT = [
  'Finish-Scratches, Gouges, Embedded Debris',
  'Finish-Dull, Rough spots',
  'Finish-Symmetry',
  'Tooth Shade',
  'Gum Shade',
  'Occlusion',
  'Screw Access',
  'Intaglio Polish',
  'Incorrect Cementing',
  'Incorrect Tooth Shade',
  'Incorrect Gum Shade',
  'Debris in interface',
  'Missing Product',
  'Rx not followed',
  'Missing glaze',
  'Debonded Ti',
  'Screw channel-Fitted, Dirty',
  'Polish antagonist',
  'Missing Tissue',
  'Ti base not cemented',
  'MUA Interface Damage',
  'Scanning issue',
  'Structure Separation',
  'Incorrect Geometry',
  'Seating issues on model',
  'LFX Housing',
  'Incorrect Screws',
  'Excess Glaze',
  'Internal Glaze Contamination',
  'Surface Porosity / Bubbles',
  'Incomplete Cleaning / Residual Material',
  'Rough Surface / Reglaze Required',
  'Missing Documentation',
  'Shade Adjustment',
  'Other',
];

const REJECT_TYPES_DESIGN = [
  'Design-ASC Changed',
  'Model not Designed',
  'Fracture caused due to design error',
  'Rx not followed',
  'Incorrect screw design',
  'Screw channel too long',
  'No Bar Design',
  'Divergence too great',
  'Angulation too extreme',
  'Distal extensions designed incorrectly',
  'Need confirmation on correct upper file, no jig designed',
  'Extensions incorrect',
  'Unclear screw for bar',
  'No shade',
  'No jig model design for bar',
  'Only 1/2 arches designed',
  'Bar: screw channel obstruction',
  'Bar with no screw info',
  'No files',
  'Low bar poor design',
  'Wrong Strap design',
  'Pre-design poor screw channel',
  'Pre-design poor screw channel - Updated STL not in Exocad',
  'Missing file',
  'No upper arch design',
  'Poor angulation TRI',
  'Bar design needed for upper',
  'Wrong product - PMMA vs Zirc',
  'No model design',
  'No design',
  'Pre-design issue',
  'Ti bases angled wrong',
  'Geometry match',
  'Wrong design',
  'Pre design needs ASC too long',
  'Screw channels cannot be milled - curved deflection',
  '2nd IR - not enough turn inside bar',
  'Confirm geometry on bar',
  'Case not designed with badger',
  'Shadeless',
  'Too tall - needs ASC or bar',
  'Other',
];

const TEAMS_WITH_DEFAULT_REJECTS = ['PMMA', 'Zirconia', 'Bars', 'Shape and Colorize'];

const getRejectTypes = (team) => {
  if (team === 'Design') return REJECT_TYPES_DESIGN;
  if (TEAMS_WITH_DEFAULT_REJECTS.includes(team)) return REJECT_TYPES_DEFAULT;
  return ['Other'];
};

const EMPTY_FORM = {
  case_number: '',
  team: '',
  technician: '',
  reject_type: '',
  reject_details: '',
  comments: '',
  ship_date: '',
  appointment_reschedule_needed: '',
  new_date_days_needed: '',
  rush_required: '',
  route_back_dept: '',
  route_back_details: '',
  reviewed_by: '',
  time_stamp: '',
};

export default function LogRemakeForm({ onSuccess }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();

  const technicians = form.team
    ? (TECHNICIANS_BY_TEAM[form.team] || ALL_TECHNICIANS)
    : ALL_TECHNICIANS;

  const set = (key, val) => {
    if (key === 'team') {
      setForm(prev => ({ ...prev, team: val, technician: '', reject_type: '' }));
    } else {
      setForm(prev => ({ ...prev, [key]: val }));
    }
  };

  const rejectTypes = getRejectTypes(form.team);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.case_number || !form.team || !form.technician) return;
    setSaving(true);
    setError(null);
    try {
      await QCLog.create({
        ...form,
        qc_reject: 'Internal Remake',
        time_stamp: form.time_stamp || new Date().toISOString(),
        new_date_days_needed: form.new_date_days_needed ? Number(form.new_date_days_needed) : null,
      });
      queryClient.invalidateQueries({ queryKey: ['qclogs'] });
      setForm(EMPTY_FORM);
      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-2">
        <PlusCircle className="w-4 h-4" />
        Log Internal Remake
      </Button>
    );
  }

  return (
    <Card className="border-violet-200 bg-violet-50/30">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold text-violet-800">Log Internal Remake</CardTitle>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Case Number *</label>
            <Input
              value={form.case_number}
              onChange={e => set('case_number', e.target.value)}
              placeholder="e.g. 2026-12345"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Dept / Step to Route Back To *</label>
            <Select value={form.team} onValueChange={v => set('team', v)} required>
              <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                {TEAMS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Technician *</label>
            <Select value={form.technician} onValueChange={v => set('technician', v)} required>
              <SelectTrigger><SelectValue placeholder="Select technician" /></SelectTrigger>
              <SelectContent>
                {technicians.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Reviewed By</label>
            <Input
              value={form.reviewed_by}
              onChange={e => set('reviewed_by', e.target.value)}
              placeholder="Technical advisor name"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Reject Type</label>
            <Select value={form.reject_type} onValueChange={v => set('reject_type', v)}>
              <SelectTrigger><SelectValue placeholder="Select reject type" /></SelectTrigger>
              <SelectContent>
                {rejectTypes.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2 lg:col-span-3 border-t border-violet-200 pt-1">
            <p className="text-xs font-semibold text-violet-700 uppercase tracking-wider">Scheduling & Routing</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Date &amp; Time</label>
            <Input
              type="datetime-local"
              value={form.time_stamp ? form.time_stamp.slice(0, 16) : ''}
              onChange={e => set('time_stamp', e.target.value ? new Date(e.target.value).toISOString() : '')}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Ship Date</label>
            <Input
              type="date"
              value={form.ship_date}
              onChange={e => set('ship_date', e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Patient Appointment — Reschedule Needed?</label>
            <div className="flex gap-3 mt-1">
              {['Yes', 'No'].map(opt => (
                <label key={opt} className="flex items-center gap-1.5 cursor-pointer text-sm font-medium">
                  <input
                    type="radio"
                    name="appointment_reschedule_needed"
                    value={opt}
                    checked={form.appointment_reschedule_needed === opt}
                    onChange={() => set('appointment_reschedule_needed', opt)}
                    className="accent-violet-600"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          {form.appointment_reschedule_needed === 'Yes' && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">New Date / Days Needed</label>
              <Input
                type="number"
                value={form.new_date_days_needed}
                onChange={e => set('new_date_days_needed', e.target.value)}
                placeholder="e.g. 3"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Rush Required?</label>
            <div className="flex gap-3 mt-1">
              {['No', 'Yes'].map(opt => (
                <label key={opt} className="flex items-center gap-1.5 cursor-pointer text-sm font-medium">
                  <input
                    type="radio"
                    name="rush_required"
                    value={opt}
                    checked={form.rush_required === opt}
                    onChange={() => set('rush_required', opt)}
                    className="accent-violet-600"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Routing Details</label>
            <Textarea
              value={form.route_back_details}
              onChange={e => set('route_back_details', e.target.value)}
              placeholder="Describe what needs to be corrected at that department…"
              maxLength={2500}
              className="min-h-[80px] resize-y"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-violet-600 hover:bg-violet-700 text-white">
              {saving ? 'Saving…' : 'Submit Internal Remake'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
