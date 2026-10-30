# OFFLINE ONLY. BASE_IMAGE is independently reviewed/pinned in toolchain.json.
ARG BASE_IMAGE
FROM ${BASE_IMAGE}
USER root
COPY inputs/node/ /usr/local/
COPY inputs/android-sdk/ /opt/android-sdk/
COPY inputs/mobile/ /opt/mobile/
COPY fixture/package-lock.json /opt/mobile/locks/fixture-package-lock.json
COPY toolchain.json /opt/mobile/versions.json
COPY image-check.mjs /opt/mobile/image-check.mjs
ENV ANDROID_HOME=/opt/android-sdk JAVA_TOOL_OPTIONS=-Xmx1536m
RUN node /opt/mobile/image-check.mjs > /opt/mobile/component-measurement.json && \
    node -e 'const fs=require("node:fs"),t=require("/opt/mobile/versions.json");fs.writeFileSync("/opt/mobile/toolchain.json",JSON.stringify({schemaVersion:t.schemaVersion,capacitorVersion:t.capacitorVersion,buildToolsVersion:t.buildToolsVersion}))'
# Strip host approval/config values from image; no self-referential image digest.
RUN rm /opt/mobile/versions.json
USER 10001:10001
WORKDIR /work
