using System.Security.Cryptography;
using System.Text;

namespace Booking.Api.Services;

public class EncryptionService : IEncryptionService
{
    private readonly string _encryptionKey;
    
    public EncryptionService(IConfiguration configuration)
    {
        // Get encryption key from configuration or use a default for development
        _encryptionKey = configuration["EncryptionKey"] ?? "DefaultDevKey123!@#$%^&*()_+{}|";
        
        // Ensure key is 32 bytes for AES-256
        if (_encryptionKey.Length < 32)
        {
            _encryptionKey = _encryptionKey.PadRight(32, '0');
        }
        else if (_encryptionKey.Length > 32)
        {
            _encryptionKey = _encryptionKey.Substring(0, 32);
        }
    }
    
    public string Encrypt(string plainText)
    {
        if (string.IsNullOrEmpty(plainText))
            return string.Empty;
            
        using var aes = Aes.Create();
        aes.Key = Encoding.UTF8.GetBytes(_encryptionKey);
        aes.GenerateIV();
        
        using var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
        using var ms = new MemoryStream();
        
        // Write IV to the beginning of the stream
        ms.Write(aes.IV, 0, aes.IV.Length);
        
        using (var cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
        using (var sw = new StreamWriter(cs))
        {
            sw.Write(plainText);
        }
        
        return Convert.ToBase64String(ms.ToArray());
    }
    
    public string Decrypt(string cipherText)
    {
        if (string.IsNullOrEmpty(cipherText))
            return string.Empty;
            
        var buffer = Convert.FromBase64String(cipherText);
        
        using var aes = Aes.Create();
        aes.Key = Encoding.UTF8.GetBytes(_encryptionKey);
        
        // Extract IV from the beginning of the buffer
        var iv = new byte[aes.IV.Length];
        Array.Copy(buffer, 0, iv, 0, iv.Length);
        aes.IV = iv;
        
        using var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
        using var ms = new MemoryStream(buffer, iv.Length, buffer.Length - iv.Length);
        using var cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read);
        using var sr = new StreamReader(cs);
        
        return sr.ReadToEnd();
    }
}