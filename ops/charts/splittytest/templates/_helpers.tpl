{{/*
Expand the name of the chart.
*/}}
{{- define "splittytest.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "splittytest.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "splittytest.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "splittytest.labels" -}}
helm.sh/chart: {{ include "splittytest.chart" . }}
{{ include "splittytest.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels (app). Components (postgresql, redis, clickhouse) add
app.kubernetes.io/component on top of these.
*/}}
{{- define "splittytest.selectorLabels" -}}
app.kubernetes.io/name: {{ include "splittytest.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Labels for a bundled component. Usage: include "splittytest.componentLabels" (list . "postgresql")
*/}}
{{- define "splittytest.componentLabels" -}}
{{- $ctx := index . 0 -}}
helm.sh/chart: {{ include "splittytest.chart" $ctx }}
{{ include "splittytest.componentSelectorLabels" . }}
app.kubernetes.io/managed-by: {{ $ctx.Release.Service }}
{{- end }}

{{- define "splittytest.componentSelectorLabels" -}}
{{- $ctx := index . 0 -}}
app.kubernetes.io/name: {{ include "splittytest.name" $ctx }}-{{ index . 1 }}
app.kubernetes.io/instance: {{ $ctx.Release.Name }}
app.kubernetes.io/component: {{ index . 1 }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "splittytest.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "splittytest.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Name of the Secret that holds credentials.
*/}}
{{- define "splittytest.secretName" -}}
{{- default (include "splittytest.fullname" .) .Values.secrets.existingSecret }}
{{- end }}

{{/*
Images
*/}}
{{- define "splittytest.image" -}}
{{- printf "%s:%s" .Values.image.repository (.Values.image.tag | default .Chart.AppVersion) }}
{{- end }}

{{- define "splittytest.migratorImage" -}}
{{- printf "%s:%s" .Values.migrator.image.repository (.Values.migrator.image.tag | default .Values.image.tag | default .Chart.AppVersion) }}
{{- end }}

{{/*
Connection details. Bundled services win over the external host settings.
*/}}
{{- define "splittytest.postgresql.host" -}}
{{- if .Values.postgresql.enabled }}
{{- printf "%s-postgresql" (include "splittytest.fullname" .) }}
{{- else }}
{{- required "postgresql.host is required when postgresql.enabled=false" .Values.postgresql.host }}
{{- end }}
{{- end }}

{{- define "splittytest.redis.host" -}}
{{- if .Values.redis.enabled }}
{{- printf "%s-redis" (include "splittytest.fullname" .) }}
{{- else }}
{{- required "redis.host is required when redis.enabled=false" .Values.redis.host }}
{{- end }}
{{- end }}

{{- define "splittytest.clickhouse.url" -}}
{{- if .Values.clickhouse.enabled }}
{{- printf "http://%s-clickhouse:8123" (include "splittytest.fullname" .) }}
{{- else }}
{{- required "clickhouse.url is required when clickhouse.enabled=false" .Values.clickhouse.url }}
{{- end }}
{{- end }}

{{/*
Public URL of the app.
*/}}
{{- define "splittytest.appUrl" -}}
{{- if .Values.app.url }}
{{- .Values.app.url | trimSuffix "/" }}
{{- else if and .Values.ingress.enabled .Values.ingress.hosts }}
{{- printf "%s://%s" (ternary "https" "http" (not (empty .Values.ingress.tls))) (first .Values.ingress.hosts).host }}
{{- else if and .Values.httpRoute.enabled .Values.httpRoute.hostnames }}
{{- printf "https://%s" (first .Values.httpRoute.hostnames) }}
{{- else }}
{{- printf "http://localhost:%v" .Values.app.port }}
{{- end }}
{{- end }}

{{/*
node-config overrides passed as NODE_CONFIG. These cover settings that can't be
set through config/custom-environment-variables.json:
  - Redis host/port: node-redis only reads them from `socket`
  - Upload folder: api/public is a symlink that doesn't resolve inside the image
  - upload.mime_types: read by routes/utils but missing from config/default.js
*/}}
{{- define "splittytest.nodeConfig" -}}
{{- $cfg := dict
  "api" (dict "port" (int .Values.app.port))
  "app" (dict "url" (include "splittytest.appUrl" .))
  "db" (dict "dict" (dict "redis" (dict "socket" (dict "host" (include "splittytest.redis.host" .) "port" (int .Values.redis.port)))))
  "upload" (dict "local" (dict "folder" "/app/ui/dist/uploads") "mime_types" .Values.app.uploads.mimeTypes)
-}}
{{- mustMergeOverwrite $cfg (deepCopy .Values.app.nodeConfig) | toJson }}
{{- end }}

{{/*
Environment shared by the app and the migration job.
*/}}
{{- define "splittytest.env" -}}
{{- $secret := include "splittytest.secretName" . -}}
- name: NODE_CONFIG
  value: {{ include "splittytest.nodeConfig" . | quote }}
- name: AUTH_SECRET
  valueFrom:
    secretKeyRef: { name: {{ $secret }}, key: AUTH_SECRET }
- name: SESSION_SECRET
  valueFrom:
    secretKeyRef: { name: {{ $secret }}, key: SESSION_SECRET }
- name: STORE_TYPE
  value: postgres
- name: POSTGRES_HOST
  value: {{ include "splittytest.postgresql.host" . | quote }}
- name: POSTGRES_PORT
  value: {{ .Values.postgresql.port | quote }}
- name: POSTGRES_USER
  value: {{ .Values.postgresql.username | quote }}
- name: POSTGRES_DATABASE
  value: {{ .Values.postgresql.database | quote }}
- name: POSTGRES_PASSWORD
  valueFrom:
    secretKeyRef: { name: {{ $secret }}, key: POSTGRES_PASSWORD }
- name: OLAP_TYPE
  value: clickhouse
- name: CLICKHOUSE_URL
  value: {{ include "splittytest.clickhouse.url" . | quote }}
- name: CLICKHOUSE_USERNAME
  value: {{ .Values.clickhouse.username | quote }}
- name: CLICKHOUSE_DATABASE
  value: {{ .Values.clickhouse.database | quote }}
- name: CLICKHOUSE_PASSWORD
  valueFrom:
    secretKeyRef: { name: {{ $secret }}, key: CLICKHOUSE_PASSWORD }
- name: DICT_TYPE
  value: redis
{{- with .Values.redis.username }}
- name: REDIS_USERNAME
  value: {{ . | quote }}
{{- end }}
- name: REDIS_PASSWORD
  valueFrom:
    secretKeyRef: { name: {{ $secret }}, key: REDIS_PASSWORD, optional: true }
- name: MAILGUN_API_KEY
  valueFrom:
    secretKeyRef: { name: {{ $secret }}, key: MAILGUN_API_KEY, optional: true }
- name: MAILGUN_DOMAIN
  valueFrom:
    secretKeyRef: { name: {{ $secret }}, key: MAILGUN_DOMAIN, optional: true }
{{- with .Values.app.extraEnv }}
{{ toYaml . }}
{{- end }}
{{- end }}

{{/*
A Secret value: the value from values.yaml, else the one already in the
cluster, else a random one. Usage:
  include "splittytest.secretValue" (dict "value" .Values.x "existing" $data "key" "X" "length" 32)
*/}}
{{- define "splittytest.secretValue" -}}
{{- if .value }}
{{- .value | toString | b64enc }}
{{- else if hasKey .existing .key }}
{{- index .existing .key }}
{{- else }}
{{- randAlphaNum (int .length) | b64enc }}
{{- end }}
{{- end }}

{{/*
Storage class field for a PVC spec. Usage: include "splittytest.storageClass" .Values.x.persistence
*/}}
{{- define "splittytest.storageClass" -}}
{{- if .storageClass }}
{{- if eq "-" .storageClass }}
storageClassName: ""
{{- else }}
storageClassName: {{ .storageClass | quote }}
{{- end }}
{{- end }}
{{- end }}
