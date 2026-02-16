# Just a stub class until I can implement Keystone license validation

class LicenseValidationError(Exception):
    pass

class LicenseValidator:
    def get_license_info(self, license_key: str):
        class _Info:
            is_valid = True
            is_expired = False
        return _Info()
