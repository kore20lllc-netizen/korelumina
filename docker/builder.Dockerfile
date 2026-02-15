FROM node:20-alpine

WORKDIR /app

# Security: no root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Disable telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Prevent runaway builds
ENV NODE_OPTIONS="--max-old-space-size=512"

CMD ["sh"]
