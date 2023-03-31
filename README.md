# README

## Propósito
El propósito de esta librería es proveer un enrutador simple, con una funcionalidad similar a UIRouter de AngularJS. Permite definir un arreglo de rutas anidadas jerarquicamente, con parámetros predefinidos para cada una de ellas, controladores y templates propios.

## Controladoras
Cada controladora debe implementar la recepción de 2 parámetros:
	1) scope: Objeto que almacena variables y sus cambios entre ejecuciones de controladoras anidadas y renderizados.
	2) params: Objeto que contiene todos los parámetros que necesita recibir la controladora. 

## Importar librería en proyecto App Script
1) Abre tu proyecto de Google Apps Script y haz clic en "Recursos" en la barra de menú.
2) Selecciona "Bibliotecas" y en el campo "Agregar una biblioteca", ingresa el siguiente ID de script: 1D2piH4IpAg3UExxOpIZE0fbCeBqmAyHjpIl4hcdc0RkEMrL5d9IQLnzN
3) Elige la última versión y selecciona "Guardar".
4) En tu código, ahora puedes usar el objeto SimpleRouter para crear y gestionar tus rutas.