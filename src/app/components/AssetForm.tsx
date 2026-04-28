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
  asset?: Asset;
  onSubmit: (asset: Omit<Asset, 'id' | 'reference' | 'status'> & { reference?: string; status?: string }) => void;
  onCancel: () => void;
}

const ASSET_CATEGORIES = [
  'IT Equipment',
  'Technical Device',
  'Storage Media',
  'Communication Equipment',
  'Sensitive Data'
];

const PROPERTY_OPTIONS = [
  'SOFIATECH',
  'Customer'
];

const PRIORITY_OPTIONS = [
  'A - Critical',
  'B - High',
  'C - Medium',
  'D - Restricted'
];

// Validation des champs
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

export function AssetForm({ departments, asset, onSubmit, onCancel }: AssetFormProps) {
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

  // Validation en temps réel
  const validateField = useCallback((name: string, value: string): string => {
    switch (name) {
      case 'departmentId':
        return !value ? 'Le département est requis' : '';
      case 'subject':
        return !value ? 'Le sujet est requis' : '';
      case 'description':
        return !value ? 'La description est requise' : '';
      case 'category':
        return !value ? 'La catégorie est requise' : '';
      case 'property':
        return !value ? 'La propriété est requise' : '';
      case 'responsible':
        return !value ? 'Le responsable est requis' : '';
      case 'owner':
        return !value ? 'Le propriétaire est requis' : '';
      case 'acquisitionDate':
        if (!value) return 'La date d\'acquisition est requise';
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate > today ? 'La date ne peut pas être dans le futur' : '';
      case 'priority':
        return !value ? 'La priorité est requise' : '';
      default:
        return '';
    }
  }, []);

  // Valider tous les champs
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Champs requis
    const requiredFields = [
      'departmentId', 'subject', 'description', 'category', 
      'property', 'responsible', 'owner', 'acquisitionDate', 'priority'
    ];

    requiredFields.forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) {
        newErrors[field as keyof FormErrors] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [formData, validateField]);

  // Mettre à jour un champ avec validation
  const handleFieldChange = useCallback((name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [touched, validateField]);

  // Marquer un champ comme touché
  const handleFieldBlur = useCallback((name: string) => {
    if (!touched[name]) {
      setTouched(prev => ({ ...prev, [name]: true }));
      const error = validateField(name, formData[name as keyof typeof formData]);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [touched, formData, validateField]);

  // Effet pour valider le formulaire à chaque changement
  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      validateForm();
    }
  }, [formData, touched, validateForm]);

  // Effet pour réinitialiser le formulaire quand l'asset change
  useEffect(() => {
    if (asset) {
      setFormData({
        departmentId: asset.departmentId || '',
        subject: asset.subject || '',
        description: asset.description || '',
        category: asset.category || '',
        property: asset.property || '',
        location: asset.location || '',
        responsible: asset.responsible || '',
        owner: asset.owner || '',
        assignedTo: asset.assignedTo || '',
        actualStatus: asset.actualStatus || '',
        returnCondition: asset.returnCondition || '',
        acquisitionDate: asset.acquisitionDate || '',
        calibrationStatus: asset.calibrationStatus || '',
        calibrationDeadline: asset.calibrationDeadline || '',
        priority: asset.priority || '',
      });
      setTouched({});
      setErrors({});
    }
  }, [asset]);

  // Mémoriser les options pour éviter les recalculs
  const categoryOptions = useMemo(() => ASSET_CATEGORIES, []);
  const propertyOptions = useMemo(() => PROPERTY_OPTIONS, []);
  const priorityOptions = useMemo(() => PRIORITY_OPTIONS, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Marquer tous les champs comme touchés
    const allFields = [
      'departmentId', 'subject', 'description', 'category', 
      'property', 'responsible', 'owner', 'acquisitionDate', 'priority'
    ];
    const newTouched = allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {});
    setTouched(newTouched);
    
    // Valider le formulaire
    if (!validateForm()) {
      alert('Veuillez corriger les erreurs dans le formulaire');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (asset) {
        onSubmit({ ...formData, reference: asset.reference, status: 'Registered' });
      } else {
        onSubmit({ ...formData, status: 'Registered' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6 shadow-md">
      <h3 className="mb-6" style={{ color: '#003366' }}>
        {asset ? 'Modifier l\'asset' : 'Nouvel asset'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2" style={{ color: '#2C3E50' }}>
              Département *
            </label>
            <Select
              required
              value={formData.departmentId}
              onValueChange={(value) => handleFieldChange('departmentId', value)}
              onOpenChange={() => handleFieldBlur('departmentId')}
              disabled={!!asset}
            >
              <SelectTrigger className={errors.departmentId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Sélectionner un département" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.departmentId && touched.departmentId && (
              <p className="text-red-500 text-sm mt-1">{errors.departmentId}</p>
            )}
          </div>

          <div>
            <label className="block mb-2" style={{ color: '#2C3E50' }}>
              Subject *
            </label>
            <Input
              required
              value={formData.subject}
              onChange={(e) => handleFieldChange('subject', e.target.value)}
              onBlur={() => handleFieldBlur('subject')}
              placeholder="Nom de l'asset"
              className={errors.subject && touched.subject ? 'border-red-500' : ''}
            />
            {errors.subject && touched.subject && (
              <p className="text-red-500 text-sm mt-1">{errors.subject}</p>
            )}
          </div>

          <div className="col-span-2">
            <label className="block mb-2" style={{ color: '#2C3E50' }}>
              Asset Description *
            </label>
            <Input
              required
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              onBlur={() => handleFieldBlur('description')}
              placeholder="Description détaillée"
              className={errors.description && touched.description ? 'border-red-500' : ''}
            />
            {errors.description && touched.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block mb-2" style={{ color: '#2C3E50' }}>
              Asset Category *
            </label>
            <Select
              required
              value={formData.category}
              onValueChange={(value) => handleFieldChange('category', value)}
              onOpenChange={() => handleFieldBlur('category')}
            >
              <SelectTrigger className={errors.category && touched.category ? 'border-red-500' : ''}>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && touched.category && (
              <p className="text-red-500 text-sm mt-1">{errors.category}</p>
            )}
          </div>

          <div>
            <label className="block mb-2" style={{ color: '#2C3E50' }}>
              Property *
            </label>
            <Select
              required
              value={formData.property}
              onValueChange={(value) => handleFieldChange('property', value)}
              onOpenChange={() => handleFieldBlur('property')}
            >
              <SelectTrigger className={errors.property && touched.property ? 'border-red-500' : ''}>
                <SelectValue placeholder="Sélectionner la propriété" />
              </SelectTrigger>
              <SelectContent>
                {propertyOptions.map((prop) => (
                  <SelectItem key={prop} value={prop}>
                    {prop}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.property && touched.property && (
              <p className="text-red-500 text-sm mt-1">{errors.property}</p>
            )}
          </div>

          <div>
            <label className="block mb-2" style={{ color: '#2C3E50' }}>
              Asset Location
            </label>
            <Input
              value={formData.location}
              onChange={(e) => handleFieldChange('location', e.target.value)}
              placeholder="Localisation"
            />
          </div>

          <div>
            <label className="block mb-2" style={{ color: '#2C3E50' }}>
              Asset Responsible *
            </label>
            <Input
              required
              value={formData.responsible}
              onChange={(e) => handleFieldChange('responsible', e.target.value)}
              onBlur={() => handleFieldBlur('responsible')}
              placeholder="Responsable"
              className={errors.responsible && touched.responsible ? 'border-red-500' : ''}
            />
            {errors.responsible && touched.responsible && (
              <p className="text-red-500 text-sm mt-1">{errors.responsible}</p>
            )}
          </div>

          <div>
            <label className="block mb-2" style={{ color: '#2C3E50' }}>
              Asset Owner *
            </label>
            <Input
              required
              value={formData.owner}
              onChange={(e) => handleFieldChange('owner', e.target.value)}
              onBlur={() => handleFieldBlur('owner')}
              placeholder="Propriétaire"
              className={errors.owner && touched.owner ? 'border-red-500' : ''}
            />
            {errors.owner && touched.owner && (
              <p className="text-red-500 text-sm mt-1">{errors.owner}</p>
            )}
          </div>

          <div>
            <label className="block mb-2" style={{ color: '#2C3E50' }}>
              Assigned To
            </label>
            <Input
              value={formData.assignedTo}
              onChange={(e) => handleFieldChange('assignedTo', e.target.value)}
              placeholder="Assigné à"
            />
          </div>

          <div>
            <label className="block mb-2" style={{ color: '#2C3E50' }}>
              Asset Actual Status
            </label>
            <Input
              value={formData.actualStatus}
              onChange={(e) => handleFieldChange('actualStatus', e.target.value)}
              placeholder="Statut actuel"
            />
          </div>

          <div>
            <label className="block mb-2" style={{ color: '#2C3E50' }}>
              Asset Return Condition
            </label>
            <Input
              value={formData.returnCondition}
              onChange={(e) => handleFieldChange('returnCondition', e.target.value)}
              placeholder="Condition de retour"
            />
          </div>

          <div>
            <label className="block mb-2" style={{ color: '#2C3E50' }}>
              Acquisition Date *
            </label>
            <Input
              required
              type="date"
              value={formData.acquisitionDate}
              onChange={(e) => handleFieldChange('acquisitionDate', e.target.value)}
              onBlur={() => handleFieldBlur('acquisitionDate')}
              className={errors.acquisitionDate && touched.acquisitionDate ? 'border-red-500' : ''}
            />
            {errors.acquisitionDate && touched.acquisitionDate && (
              <p className="text-red-500 text-sm mt-1">{errors.acquisitionDate}</p>
            )}
          </div>

          <div>
            <label className="block mb-2" style={{ color: '#2C3E50' }}>
              Calibration Status
            </label>
            <Input
              value={formData.calibrationStatus}
              onChange={(e) => handleFieldChange('calibrationStatus', e.target.value)}
              placeholder="Statut de calibration"
            />
          </div>

          <div>
            <label className="block mb-2" style={{ color: '#2C3E50' }}>
              Calibration Validity Deadline
            </label>
            <Input
              type="date"
              value={formData.calibrationDeadline}
              onChange={(e) => handleFieldChange('calibrationDeadline', e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-2" style={{ color: '#2C3E50' }}>
              Priority *
            </label>
            <Select
              required
              value={formData.priority}
              onValueChange={(value) => handleFieldChange('priority', value)}
              onOpenChange={() => handleFieldBlur('priority')}
            >
              <SelectTrigger className={errors.priority && touched.priority ? 'border-red-500' : ''}>
                <SelectValue placeholder="Sélectionner la priorité" />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {priority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.priority && touched.priority && (
              <p className="text-red-500 text-sm mt-1">{errors.priority}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button 
            type="submit" 
            style={{ backgroundColor: '#F47B20' }} 
            className="hover:opacity-90"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Traitement...' : (asset ? 'Modifier' : 'Créer')}
          </Button>
          <Button 
            type="button" 
            onClick={onCancel} 
            variant="outline"
            disabled={isSubmitting}
          >
            Annuler
          </Button>
        </div>
      </form>
    </Card>
  );
}