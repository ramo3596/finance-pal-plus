import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Scan, X } from "lucide-react";
import { useInventory } from "@/hooks/useInventory";
import { useSettings } from "@/hooks/useSettings";
import { toast } from "@/hooks/use-toast";
import Quagga from "quagga";

const productSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().optional(),
  barcode: z.string().optional(),
  quantity: z.number().min(0, "La cantidad debe ser mayor o igual a 0"),
  price: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  cost: z.number().min(0, "El costo debe ser mayor o igual a 0"),
  category_id: z.string().optional(),
  subcategory_id: z.string().optional(),
  image_url: z.string().url("URL de imagen inválida").optional().or(z.literal("")),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductInfoFormProps {
  onSuccess: () => void;
}

export function ProductInfoForm({ onSuccess }: ProductInfoFormProps) {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { createProduct } = useInventory();
  const { categories, tags } = useSettings();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      quantity: 0,
      price: 0,
      cost: 0,
    },
  });

  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
  const subcategories = selectedCategoryData?.subcategories || [];

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(event.target.value);
  };

  const startCamera = async () => {
    try {
      setIsScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Usar cámara trasera si está disponible
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Inicializar QuaggaJS
        setTimeout(() => {
          initQuagga();
        }, 500);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Error",
        description: "No se pudo acceder a la cámara. Verifica los permisos.",
        variant: "destructive"
      });
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    Quagga.stop();
    setIsScanning(false);
  };

  const initQuagga = () => {
    if (!videoRef.current) return;

    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: videoRef.current,
        constraints: {
          width: 800,
          height: 600,
          facingMode: "environment"
        },
        area: {
          top: "20%",
          right: "20%",
          left: "20%",
          bottom: "20%"
        }
      },
      frequency: 10,
      decoder: {
        readers: [
          "code_128_reader",
          "ean_reader",
          "ean_8_reader",
          "code_39_reader",
          "code_39_vin_reader",
          "codabar_reader",
          "upc_reader",
          "upc_e_reader",
          "i2of5_reader"
        ],
        debug: {
          showCanvas: true,
          showPatches: true,
          showFoundPatches: true,
          showSkeleton: true,
          showLabels: true,
          showPatchLabels: true,
          showRemainingPatchLabels: true,
          boxFromPatches: {
            showTransformed: true,
            showTransformedBox: true,
            showBB: true
          }
        }
      },
      locate: true,
      locator: {
        patchSize: "large",
        halfSample: false
      },
      numOfWorkers: 2,
      multiple: false
    }, (err) => {
      if (err) {
        console.error('Error initializing Quagga:', err);
        toast({
          title: "Error",
          description: "No se pudo inicializar el escáner",
          variant: "destructive"
        });
        return;
      }
      console.log('Quagga initialized successfully');
      Quagga.start();
    });

    // Mejorar la detección con múltiples intentos
    let detectionCount = 0;
    let lastDetectedCode = '';
    
    Quagga.onDetected((result) => {
      const code = result.codeResult.code;
      console.log('Código detectado:', code, 'Calidad:', result.codeResult.quality);
      
      if (code && result.codeResult.quality > 75) {
        if (code === lastDetectedCode) {
          detectionCount++;
        } else {
          detectionCount = 1;
          lastDetectedCode = code;
        }
        
        // Confirmar detección después de 2 lecturas consecutivas del mismo código
        if (detectionCount >= 2) {
          setValue('barcode', code);
          toast({
            title: "Código detectado",
            description: `Código de barras: ${code}`
          });
          handleScannerClose();
        }
      }
    });
  };

  const handleScannerOpen = () => {
    setIsScannerOpen(true);
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  const handleScannerClose = () => {
    stopCamera();
    setIsScannerOpen(false);
  };

  const handleManualBarcodeInput = () => {
    const barcode = prompt('Ingresa el código de barras manualmente:');
    if (barcode) {
      setValue('barcode', barcode);
      toast({
        title: "Código agregado",
        description: `Código de barras: ${barcode}`
      });
    }
    handleScannerClose();
  };

  // Limpiar QuaggaJS al desmontar el componente
  useEffect(() => {
    return () => {
      Quagga.stop();
    };
  }, []);

  const onSubmit = async (data: ProductFormData) => {
    try {
      await createProduct({
        name: data.name,
        description: data.description,
        barcode: data.barcode,
        quantity: data.quantity,
        price: data.price,
        cost: data.cost,
        category_id: data.category_id || null,
        subcategory_id: data.subcategory_id || null,
        tags: selectedTags,
        image_url: imageUrl,
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Image Upload */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-muted-foreground/25 rounded-md">
            {imageUrl ? (
              <img src={imageUrl} alt="Product Preview" className="max-h-full max-w-full object-contain" />
            ) : (
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">Arrastra y suelta una imagen aquí, o haz clic para seleccionar</p>
                <Input
                  id="image_upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('image_upload')?.click()}>
                  Cargar desde local
                </Button>
              </div>
            )}
          </div>
          <div className="mt-4 space-y-2">
            <Label htmlFor="image_url_input">URL de Imagen</Label>
            <div className="flex space-x-2">
              <Input
                id="image_url_input"
                placeholder="O pega una URL de imagen aquí"
                value={imageUrl || ''}
                onChange={handleImageUrlChange}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={() => setImageUrl(null)}>
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="barcode">Código de barras</Label>
          <div className="flex space-x-2">
            <Input
              id="barcode"
              placeholder="Código de barras"
              {...register("barcode")}
            />
            <Button type="button" variant="outline" size="icon" onClick={handleScannerOpen}>
              <Scan className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Nombre del producto *</Label>
          <Input
            id="name"
            placeholder="Nombre del producto"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Cantidad disponible *</Label>
          <Input
            id="quantity"
            type="number"
            placeholder="0"
            {...register("quantity", { valueAsNumber: true })}
          />
          {errors.quantity && (
            <p className="text-sm text-destructive">{errors.quantity.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Precio</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("price", { valueAsNumber: true })}
          />
          {errors.price && (
            <p className="text-sm text-destructive">{errors.price.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cost">Costo</Label>
          <Input
            id="cost"
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("cost", { valueAsNumber: true })}
          />
          {errors.cost && (
            <p className="text-sm text-destructive">{errors.cost.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Categoría</Label>
          <Select
            value={selectedCategory}
            onValueChange={(value) => {
              setSelectedCategory(value);
              setValue("category_id", value);
              setValue("subcategory_id", ""); // Reset subcategory
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.filter(category => category.id && category.id.trim() !== '').map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center space-x-2">
                    <span>{category.icon}</span>
                    <span>{category.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Subcategory (conditional) */}
      {subcategories.length > 0 && (
        <div className="space-y-2">
          <Label>Subcategoría</Label>
          <Select onValueChange={(value) => setValue("subcategory_id", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar subcategoría" />
            </SelectTrigger>
            <SelectContent>
              {subcategories.filter(subcategory => subcategory.id && subcategory.id.trim() !== '').map((subcategory) => (
                <SelectItem key={subcategory.id} value={subcategory.id}>
                  <div className="flex items-center space-x-2">
                    <span>{subcategory.icon}</span>
                    <span>{subcategory.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Tags */}
      <div className="space-y-2">
        <Label>Etiquetas</Label>
        <Select onValueChange={(value) => {
          if (!selectedTags.includes(value)) {
            setSelectedTags([...selectedTags, value]);
          }
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar etiquetas" />
          </SelectTrigger>
          <SelectContent>
            {tags.filter(tag => tag.name && tag.name.trim() !== '' && !selectedTags.includes(tag.name)).map((tag) => (
              <SelectItem key={tag.id} value={tag.name}>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: tag.color }}
                  />
                  <span>{tag.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedTags.map((tag, index) => (
              <div key={index} className="flex items-center space-x-1 bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm">
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => setSelectedTags(selectedTags.filter((_, i) => i !== index))}
                  className="hover:text-destructive"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          placeholder="Descripción detallada del producto"
          {...register("description")}
        />
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creando..." : "Crear producto"}
        </Button>
      </form>

      {/* Modal del escáner de código de barras */}
      <Dialog open={isScannerOpen} onOpenChange={handleScannerClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Escáner de código de barras
              <Button variant="ghost" size="icon" onClick={handleScannerClose}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {isScanning ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full h-80 bg-black rounded-lg"
                  autoPlay
                  playsInline
                  muted
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    {/* Marco de enfoque principal */}
                    <div className="border-4 border-red-500 w-64 h-20 rounded-lg bg-transparent shadow-lg">
                      {/* Esquinas del marco */}
                      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                    </div>
                    {/* Línea de escaneo animada */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-lg">
                      <div className="absolute w-full h-0.5 bg-red-400 animate-pulse" style={{top: '50%', transform: 'translateY(-50%)'}}></div>
                    </div>
                  </div>
                </div>
                {/* Instrucciones */}
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <p className="text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full mx-auto inline-block">
                    Coloca el código dentro del marco rojo
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-80 bg-gray-100 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-500">Iniciando cámara...</p>
                </div>
              </div>
            )}
            
            <div className="flex space-x-2">
              <Button 
                onClick={handleManualBarcodeInput} 
                variant="outline" 
                className="flex-1"
              >
                Ingresar manualmente
              </Button>
              <Button 
                onClick={handleScannerClose} 
                variant="secondary" 
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
            
            <p className="text-sm text-gray-600 text-center">
              Coloca el código de barras dentro del marco para escanearlo
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}