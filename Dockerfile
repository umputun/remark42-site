FROM node:12-alpine as assets

WORKDIR /app

COPY package.json yarn.lock postcss.config.js ./
RUN yarn install --frozen-lockfile

ENV PARCEL_WORKERS=1
COPY scripts scripts
COPY assets assets
RUN \
	mkdir data \
	&& yarn build:assets

FROM golang:1.14-alpine3.11

WORKDIR /app

ARG HUGO_VER=0.68.3
ENV ENV=production
ADD https://github.com/gohugoio/hugo/releases/download/v${HUGO_VER}/hugo_${HUGO_VER}_Linux-64bit.tar.gz /tmp
ADD https://github.com/gohugoio/hugo/releases/download/v${HUGO_VER}/hugo_${HUGO_VER}_checksums.txt /tmp
RUN \
	cd /tmp \
	&& apk add git \
	&& grep hugo_${HUGO_VER}_Linux-64bit.tar.gz hugo_${HUGO_VER}_checksums.txt | sha256sum -c \
	&& tar -zxf hugo_${HUGO_VER}_Linux-64bit.tar.gz \
	&& cp -fv /tmp/hugo /bin/hugo
COPY static /app/static
COPY layouts /app/layouts
COPY content /app/content
COPY config.yaml startup.sh /app/
COPY --from=assets /app/data /app/data
COPY --from=assets /app/static/assets /app/static/assets
RUN chmod +x startup.sh

CMD [ "./startup.sh" ]
EXPOSE 1313
