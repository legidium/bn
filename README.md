# Фронт-енд для [bn.ru](http://bn.ru)


Что нужно установить и как запустить смотрите [здесь](https://github.com/bem/project-stub/blob/bem-core/README.ru.md)






Для форматированного HTML надо 

установить gulp 
	
	*    npm install -g gulp

выполнить в консоли

	*    cd /bn_frontend
	*    enb make (или ./node_modules/enb/bin/enb make)
	*    gulp


После этого в папке /merged/ появятсе готовые файлы

Eсли при выполнении enb make сыпятся ошибки, надо почистить кеш удалив файл /.enb/tmp/cache.js


Папка /desktop.bundles/merged техническая и нужна для сборки реализаций всех блоков в один файл



