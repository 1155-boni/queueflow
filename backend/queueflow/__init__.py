# This will make sure the app is always imported when
# Django starts so that shared_task will use this app.
try:
    # Try absolute import first so tools and linters can resolve the module.
    # Fallback to a relative import at runtime if the absolute path is not available.
    import importlib

    try:
        celery_app = importlib.import_module('queueflow.celery_app').app
    except Exception:
        from .celery_app import app as celery_app
except Exception:
    celery_app = None

if celery_app:
    __all__ = ('celery_app',)
else:
    __all__ = ()
