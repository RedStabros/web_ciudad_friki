# Guía de Réplica: Nueva Categoría "Princesas" en la App Móvil

Esta guía detalla el procedimiento técnico paso a paso para incorporar la nueva categoría de **Princesas** a la aplicación móvil (desarrollada en Expo / React Native), asegurando una paridad total con la plataforma web.

---

## 📋 Pasos para la Integración

### Paso 1: Copiar el Archivo del Icono
Debes copiar el archivo de icono optimizado al directorio de assets de la aplicación móvil.

*   **Ruta de origen:** `D:\APP_development\Assest varios\Ciudad Friki y idle\iconos\optimizados\icono-princess512x512.png`
*   **Ruta de destino:** `d:\APP_development\Ciudad_friki\mobile\assets\icons\icon_princess.png`

---

### Paso 2: Registrar el Icono en `triviaIcons.ts`
Debes asociar el identificador de la categoría de la base de datos (`icon_princess`) con el recurso estático de React Native.

1.  Abre el archivo [triviaIcons.ts](file:///d:/APP_development/Ciudad_friki/mobile/src/utils/triviaIcons.ts).
2.  Importa el asset en el objeto `TRIVIA_ICONS` agregando la siguiente línea (se recomienda mantener el orden alfabético):

```typescript
export const TRIVIA_ICONS: Record<string, ImageSourcePropType> = {
    // ... otros iconos
    'icon_mitologia': require('../../assets/icons/icon_mitologia.png'),
    'icon_princess': require('../../assets/icons/icon_princess.png'), // <-- AGREGAR ESTA LÍNEA
    'icon_rol': require('../../assets/icons/icon_rol.png'),
    // ... otros iconos
};
```

---

### Paso 3: Configurar las Traducciones i18n
Dado que los componentes de la aplicación móvil usan `t('categories.' + categoryId, fallbackName)` para renderizar el nombre de la categoría en el idioma correcto, registra la clave en los archivos JSON.

#### 1. En Español
Abre el archivo [es.json](file:///d:/APP_development/Ciudad_friki/mobile/src/locales/es.json) de la aplicación móvil, navega hasta el final y añade el bloque `"categories"` (o agrégalo dentro del bloque si ya existe):

```json
  "maintenance": {
    "title": "¡Próximo lanzamiento!",
    "message": "Estamos preparando los últimos detalles para el gran lanzamiento oficial de Ciudad Friki Web. ¡Falta muy poco para la apertura!",
    "scheduled": "Lanzamiento en preparación",
    "adminLogin": "Acceso Staff"
  },
  "categories": {
    "princesas": "Princesas"
  }
}
```

#### 2. En Inglés
Abre el archivo [en.json](file:///d:/APP_development/Ciudad_friki/mobile/src/locales/en.json) de la aplicación móvil y agrega el equivalente:

```json
  "categories": {
    "princesas": "Princesses"
  }
}
```

---

### Paso 4: Sincronización y Verificación en la App
Una vez realizados los pasos anteriores:
1.  **Suscripción en Tiempo Real:** Al estar conectado a Supabase, la aplicación móvil leerá automáticamente la categoría `princesas` de la tabla `triviaduels_categories` y las preguntas de `triviaduels_questions` sin necesidad de reinstalar o modificar nada en el backend.
2.  **Prueba de Duelo:** Abre el mural de creación de duelos VS en la app móvil y corrobora que la categoría "Princesas" aparezca listada con su respectivo icono de corona.
3.  **Prueba de Aportes:** Valida que al seleccionar la categoría en el formulario de aportación de preguntas desde el celular, el icono cargue sin problemas y no genere pantallas rojas o de error de require.
