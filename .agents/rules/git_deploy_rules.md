# Reglas de Git y Despliegue (Git & Deployment Rules)

## Regla Inquebrantable (Unbreakable Rule)

1. **NUNCA HAGAS `git push` SIN AUTORIZACIÓN EXPLÍCITA DEL USUARIO**.
2. Una vez que hayas terminado de realizar cambios (incluso si `npm run build` o las pruebas han pasado), **SIEMPRE debes pedir al usuario que verifique localmente** que todo funciona de acuerdo a sus expectativas antes de hacer un push al repositorio remoto.
3. El propósito de esta regla es evitar desencadenar pipelines CI/CD (como Vercel) prematuramente o con errores visuales/lógicos, para no desperdiciar minutos de deploy ni afectar el entorno de producción.
4. Tu flujo de trabajo final en cualquier tarea debe ser:
   - Terminar el código.
   - Ejecutar verificaciones (por ejemplo, `npm run build`).
   - Notificar al usuario para que pruebe localmente.
   - Detenerte y esperar la orden directa de realizar `git commit` y `git push`.
