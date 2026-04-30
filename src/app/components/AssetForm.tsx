import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface Department {
  id: string;
  name: string;
  code: string;
}

interface AssetPerson {
  id: string;
  name: string;
  departmentId: string;
  type: 'owner' | 'responsible';
}

export interface Asset {
  id: string;
  departmentId: string;
  reference: string;
  subject: string;
  description: string;
  category: string;
  property: string;
  location: string;
  responsible: string;
  owner: string;
  assignedTo: string;
  actualStatus: string;
  returnCondition: string;
  acquisitionDate: string;
  calibrationStatus: string;
  calibrationDeadline: string;
  status: string;
  priority: string;
}

interface AssetFormProps {
  departments: Department[];
  people: AssetPerson[];
  asset?: Asset;
  onSubmit: (asset: Omit<Asset, 'id' | 'reference' | 'status'> & { reference?: string; status?: string }) => void;
  onCancel: () => void;
}

const ASSET_CATEGORIES = ['IT Equipment', 'Technical Device', 'Storage Media', 'Communication Equipment', 'Sensitive Data'];
const PROPERTY_OPTIONS = ['SOFIATECH', 'Customer'];
const PRIORITY_OPTIONS = ['A - Critical', 'B - High', 'C - Medium', 'D - Restricted'];

interface FormErrors {
  departmentId?: string;
  subject?: string;
  description?: string;
  category?: string;
  property?: string;
  responsible?: string;
  owner?: string;
  acquisitionDate?: string;
  priority?: string;
}

export function AssetForm({ departments, people, asset, onSubmit, onCancel }: AssetFormProps) {
  const [formData, setFormData] = useState({
    departmentId: asset?.departmentId || '',
    subject: asset?.subject || '',
    description: asset?.description || '',
    category: asset?.category || '',
    property: asset?.property || '',
    location: asset?.location || '',
    responsible: asset?.responsible || '',
    owner: asset?.owner || '',
    assignedTo: asset?.assignedTo || '',
    actualStatus: asset?.actualStatus || '',
    returnCondition: asset?.returnCondition || '',
    acquisitionDate: asset?.acquisitionDate || '',
    calibrationStatus: asset?.calibrationStatus || '',
    calibrationDeadline: asset?.calibrationDeadline || '',
    priority: asset?.priority || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // ── Filtrer people par département sélectionné ──
  const deptResponsibles = useMemo(() =>
    people.filter(p => p.departmentId === formData.departmentId && p.type === 'responsible'),
    [people, formData.departmentId]
  );
  const deptOwner = useMemo(() =>
    people.find(p => p.departmentId === formData.departmentId && p.type === 'owner'),
    [people, formData.departmentId]
  );

  // Auto-fill location et owner quand département change
  const handleDeptChange = (deptId: string) => {
    const dept = departments.find(d => d.id === deptId);
    const owner = people.find(p => p.departmentId === deptId && p.type === 'owner');
    setFormData(prev => ({
      ...prev,
      departmentId: deptId,
      location: dept?.name || prev.location,
      owner: owner?.name || '',
      responsible: '',
    }));
  };

  const validateField = useCallback((name: string, value: string): string => {
    switch (name) {
      case 'departmentId': return !value ? 'Le département est requis' : '';
      case 'subject': return !value ? 'Le sujet est requis' : '';
      case 'description': return !value ? 'La description est requise' : '';
      case 'category': return !value ? 'La catégorie est requise' : '';
      case 'property': return !value ? 'La propriété est requise' : '';
      case 'responsible': return !value ? 'Le responsable est requis' : '';
      case 'owner': return !value ? 'Le propriétaire est requis' : '';
      case 'acquisitionDate':
        if (!value) return "La date d'acquisition est requise";
        const selectedDate = new Date(value);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        return selectedDate > today ? 'La date ne peut pas être dans le futur' : '';
      case 'priority': return !value ? 'La priorité est requise' : '';
      default: return '';
    }
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;
    ['departmentId', 'subject', 'description', 'category', 'property', 'responsible', 'owner', 'acquisitionDate', 'priority'].forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) { newErrors[field as keyof FormErrors] = error; isValid = false; }
    });
    setErrors(newErrors);
    return isValid;
  }, [formData, validateField]);

  const handleFieldChange = useCallback((name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }
  }, [touched, validateField]);

  const handleFieldBlur = useCallback((name: string) => {
    if (!touched[name]) {
      setTouched(prev => ({ ...prev, [name]: true }));
      setErrors(prev => ({ ...prev, [name]: validateField(name, formData[name as keyof typeof formData]) }));
    }
  }, [touched, formData, validateField]);

  useEffect(() => {
    if (Object.keys(touched).length > 0) validateForm();
  }, [formData, touched, validateForm]);

  useEffect(() => {
    if (asset) {
      setFormData({
        departmentId: asset.departmentId || '', subject: asset.subject || '',
        description: asset.description || '', category: asset.category || '',
        property: asset.property || '', location: asset.location || '',
        responsible: asset.responsible || '', owner: asset.owner || '',
        assignedTo: asset.assignedTo || '', actualStatus: asset.actualStatus || '',
        returnCondition: asset.returnCondition || '', acquisitionDate: asset.acquisitionDate || '',
        calibrationStatus: asset.calibrationStatus || '', calibrationDeadline: asset.calibrationDeadline || '',
        priority: asset.priority || '',
      });
      setTouched({}); setErrors({});
    }
  }, [asset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allFields = ['departmentId', 'subject', 'description', 'category', 'property', 'responsible', 'owner', 'acquisitionDate', 'priority'];
    setTouched(allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {}));
    if (!validateForm()) { alert('Veuillez corriger les erreurs dans le formulaire'); return; }
    setIsSubmitting(true);
    try {
      if (asset) onSubmit({ ...formData, reference: asset.reference, status: 'Registered' });
      else onSubmit({ ...formData, status: 'Registered' });
    } finally { setIsSubmitting(false); }
  };

  const err = (field: string) => errors[field as keyof FormErrors] && touched[field]
    ? <p className="text-red-500 text-sm mt-1">{errors[field as keyof FormErrors]}</p>
    : null;
  const cls = (field: string) => errors[field as keyof FormErrors] && touched[field] ? 'border-red-500' : '';

  return (
    <Card className="p-6 shadow-md">
      <h3 className="mb-6" style={{ color: '#003366' }}>{asset ? "Modifier l'asset" : 'Nouvel asset'}</h3>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4 mb-6">

          {/* Département */}
          <div>
            <label className="block mb-2" style={{ color: '#2C3E50' }}>Département *</label>
            <Select value={formData.departmentId} onValueChange={handleDeptChange} onOpenChange={() => handleFieldBlur('departmentId')}>
              <SelectTrigger className={cls('departmentId')}><SelectValue placeholder="Sélectionner un département" /></SelectTrigger>
              <SelectContent>
                {departments.map(dept => <SelectItem key={dept.id} value={dept.id}>{dept.name} ({dept.code})</SelectItem>)}
              </SelectContent>
            </Select>
            {err('departmentId')}
          </div>

          {/* Subject */}
          <div>
            <label className="block mb-2" style={{ color: '#2C3E50' }}>Subject *</label>
            <Input value={formData.subject} onChange={(e) => handleFieldChange('subject', e.target.value)} onBlur={() => handleFieldBlur('subject')} placeholder="Sujet de l'asset" className={cls('subject')} />
            {err('subject')}
          </div>

          {/* Description */}
          <div className="col-span-2">
            <label className="block mb-2" style={{ color: '#2C3E50' }}>Asset Description *</label>
            <Input value={formData.description} onChange={(e) => handleFieldChange('description', e.target.value)} onBlur={() => handleFieldBlur('description')} placeholder="Description détaillée" className={cls('description')} />
            {err('description')}
          </div>

          {/* Category */}
          <div>
            <label className="block mb-2" style={{ color: '#2C3E50' }}>Asset Category *</label>
            <Select value={formData.category} onValueChange={(v) => handleFieldChange('category', v)} onOpenChange={() => handleFieldBlur('category')}>
              <SelectTrigger className={cls('category')}><SelectValue placeholder="Sélectionner une catégorie" /></SelectTrigger>
              <SelectContent>{ASSET_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            {err('category')}
          </div>

          {/* Property */}
          <div>
            <label className="block mb-2" style={{ color: '#2C3E50' }}>Property *</label>
            <Select value={formData.property} onValueChange={(v) => handleFieldChange('property', v)} onOpenChange={() => handleFieldBlur('property')}>
              <SelectTrigger className={cls('property')}><SelectValue placeholder="Sélectionner la propriété" /></SelectTrigger>
              <SelectContent>{PROPERTY_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
            {err('property')}
          </div>

          {/* Asset Location (auto-filled) */}
          <div>
            <label className="block mb-2" style={{ color: '#2C3E50' }}>Asset Location</label>
            <Input value={formData.location} onChange={(e) => handleFieldChange('location', e.target.value)} placeholder="Localisation (auto depuis département)" />
          </div>

          {/* Asset Responsible - DROPDOWN */}
          <div>
            <label className="block mb-2" style={{ color: '#2C3E50' }}>Asset Responsible *</label>
            {deptResponsibles.length > 0 ? (
              <Select value={formData.responsible} onValueChange={(v) => handleFieldChange('responsible', v)} onOpenChange={() => handleFieldBlur('responsible')}>
                <SelectTrigger className={cls('responsible')}><SelectValue placeholder="Sélectionner un responsable" /></SelectTrigger>
                <SelectContent>
                  {deptResponsibles.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <div>
                <Input value={formData.responsible} onChange={(e) => handleFieldChange('responsible', e.target.value)} onBlur={() => handleFieldBlur('responsible')} placeholder={formData.departmentId ? 'Aucun responsible défini pour ce dept.' : 'Sélectionnez un département d\'abord'} className={cls('responsible')} />
                {formData.departmentId && deptResponsibles.length === 0 && (
                  <p className="text-xs mt-1" style={{ color: '#F47B20' }}>Ajoutez des responsables dans "Owner & Responsible"</p>
                )}
              </div>
            )}
            {err('responsible')}
          </div>

          {/* Asset Owner - DROPDOWN (auto depuis département) */}
          <div>
            <label className="block mb-2" style={{ color: '#2C3E50' }}>Asset Owner *</label>
            {deptOwner ? (
              <div className="flex items-center gap-2 p-2 rounded border" style={{ borderColor: '#4A90E2', backgroundColor: '#E8F4F8' }}>
                <span style={{ color: '#003366', fontWeight: 500 }}>{deptOwner.name}</span>
                <span className="text-xs ml-auto" style={{ color: '#4A90E2' }}>Auto depuis département</span>
              </div>
            ) : (
              <Input value={formData.owner} onChange={(e) => handleFieldChange('owner', e.target.value)} onBlur={() => handleFieldBlur('owner')} placeholder={formData.departmentId ? 'Aucun owner défini pour ce dept.' : 'Sélectionnez un département d\'abord'} className={cls('owner')} />
            )}
            {err('owner')}
          </div>

          {/* Assigned To */}
          <div>
            <label className="block mb-2" style={{ color: '#2C3E50' }}>Assigned To</label>
            <Input value={formData.assignedTo} onChange={(e) => handleFieldChange('assignedTo', e.target.value)} placeholder="Assigné à" />
          </div>

          {/* Actual Status */}
          <div>
            <label className="block mb-2" style={{ color: '#2C3E50' }}>Asset Actual Status</label>
            <Input value={formData.actualStatus} onChange={(e) => handleFieldChange('actualStatus', e.target.value)} placeholder="Statut actuel" />
          </div>

          {/* Return Condition */}
          <div>
            <label className="block mb-2" style={{ color: '#2C3E50' }}>Asset Return Condition</label>
            <Input value={formData.returnCondition} onChange={(e) => handleFieldChange('returnCondition', e.target.value)} placeholder="Condition de retour" />
          </div>

          {/* Acquisition Date */}
          <div>
            <label className="block mb-2" style={{ color: '#2C3E50' }}>Acquisition Date *</label>
            <Input required type="date" value={formData.acquisitionDate} onChange={(e) => handleFieldChange('acquisitionDate', e.target.value)} onBlur={() => handleFieldBlur('acquisitionDate')} className={cls('acquisitionDate')} />
            {err('acquisitionDate')}
          </div>

          {/* Calibration Status */}
          <div>
            <label className="block mb-2" style={{ color: '#2C3E50' }}>Calibration Status</label>
            <Input value={formData.calibrationStatus} onChange={(e) => handleFieldChange('calibrationStatus', e.target.value)} placeholder="Statut de calibration" />
          </div>

          {/* Calibration Deadline */}
          <div>
            <label className="block mb-2" style={{ color: '#2C3E50' }}>Calibration Validity Deadline</label>
            <Input type="date" value={formData.calibrationDeadline} onChange={(e) => handleFieldChange('calibrationDeadline', e.target.value)} />
          </div>

          {/* Priority */}
          <div>
            <label className="block mb-2" style={{ color: '#2C3E50' }}>Priority *</label>
            <Select value={formData.priority} onValueChange={(v) => handleFieldChange('priority', v)} onOpenChange={() => handleFieldBlur('priority')}>
              <SelectTrigger className={cls('priority')}><SelectValue placeholder="Sélectionner la priorité" /></SelectTrigger>
              <SelectContent>{PRIORITY_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
            {err('priority')}
          </div>

        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" style={{ backgroundColor: '#F47B20' }} className="hover:opacity-90" disabled={isSubmitting}>
            {isSubmitting ? 'Traitement...' : (asset ? 'Modifier' : 'Créer')}
          </Button>
          <Button type="button" onClick={onCancel} variant="outline" disabled={isSubmitting}>Annuler</Button>
        </div>
      </form>
    </Card>
  );
}
