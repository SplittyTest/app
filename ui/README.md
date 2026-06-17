# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).


## Migration

docker run -it \
--env POSTGRES_HOST=<PG_HOST> \
--env POSTGRES_USER=admin  \
--env POSTGRES_PASSWORD=admin \
--env POSTGRES_DATABASE=splittytest \
migrate migrate:postgres