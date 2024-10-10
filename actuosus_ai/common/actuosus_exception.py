class ActuosusException(Exception):
    pass


class NotFoundException(ActuosusException):
    pass


class ValidationException(ActuosusException):
    pass


class IOException(ActuosusException):
    pass


class NetworkException(ActuosusException):
    pass


class InternalException(ActuosusException):
    pass


class UnknownException(ActuosusException):
    pass
