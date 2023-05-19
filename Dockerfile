FROM mongo as base

EXPOSE 27017

CMD ["mongod"]